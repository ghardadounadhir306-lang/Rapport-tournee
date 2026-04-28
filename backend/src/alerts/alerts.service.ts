import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ANOMALY_TYPE_CODES } from '../anomalies/anomaly-type-codes';
import { Anomaly } from '../anomalies/entities/anomaly.entity';
import { TmsFormData } from '../tms/entities/tms-form-data.entity';
import { GpsService } from '../gps/gps.service';

export type AlertSeverity = 'INFO' | 'ALERTE' | 'BLOQUANT';

export type OperationalAlert = {
  code: string;
  severity: AlertSeverity;
  message: string;
  tmsFormId?: string;
  meta?: Record<string, unknown>;
};

const SENSITIVE_RE = /prima\s*aqua|box\s*dhl|dhl|prima/i;

function parseKm(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number.parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function severityForAnomalyTypeCode(code: string): AlertSeverity {
  if (code === ANOMALY_TYPE_CODES.ABSENCE_LISTE_COLISAGE) return 'INFO';
  return 'ALERTE';
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(TmsFormData)
    private readonly formRepo: Repository<TmsFormData>,
    @InjectRepository(Anomaly)
    private readonly anomalyRepo: Repository<Anomaly>,
    private readonly gpsService: GpsService,
  ) {}

  private async loadPersistedAnomaliesAsAlerts(filters: {
    tmsFormId?: string;
    date?: string;
  }): Promise<OperationalAlert[]> {
    try {
      const aq = this.anomalyRepo
        .createQueryBuilder('a')
        .innerJoinAndSelect('a.anomalyType', 't')
        .leftJoin(TmsFormData, 'f', 'f.id = a.tournee_id');
      if (filters.tmsFormId?.trim()) {
        aq.andWhere('a.tournee_id = :tid', { tid: filters.tmsFormId.trim() });
      }
      if (filters.date?.trim()) {
        aq.andWhere('f.date = :d', { d: filters.date.trim() });
      }
      const anoms = await aq.getMany();
      return anoms.map((x) => ({
        code: x.anomalyType.code,
        severity: severityForAnomalyTypeCode(x.anomalyType.code),
        message: (x.description ?? '').trim() || x.anomalyType.label,
        tmsFormId: x.tourneeId,
        meta: {
          source: 'persisted',
          anomalyId: x.id,
          prestationId: x.prestationId,
          camionId: x.camionId,
        },
      }));
    } catch {
      return [];
    }
  }

  private persistedCodesByTour(persisted: OperationalAlert[]): Map<string, Set<string>> {
    const m = new Map<string, Set<string>>();
    for (const p of persisted) {
      const tid = p.tmsFormId ?? '';
      if (!tid) continue;
      if (!m.has(tid)) m.set(tid, new Set());
      m.get(tid)!.add(p.code);
    }
    return m;
  }

  async getAlerts(filters: { tmsFormId?: string; date?: string }): Promise<OperationalAlert[]> {
    const persisted = await this.loadPersistedAnomaliesAsAlerts(filters);
    const pc = this.persistedCodesByTour(persisted);

    const qb = this.formRepo.createQueryBuilder('f');
    if (filters.tmsFormId?.trim()) {
      qb.andWhere('f.id = :id', { id: filters.tmsFormId.trim() });
    }
    if (filters.date?.trim()) {
      qb.andWhere('f.date = :d', { d: filters.date.trim() });
    }
    const rows = await qb.getMany();
    const allForDup = await this.formRepo.find();
    const alerts: OperationalAlert[] = [...persisted];

    const dupMap = new Map<string, string[]>();
    for (const r of allForDup) {
      if ((r.prestationId ?? '').trim() && (r.siteId ?? '').trim()) continue;
      const key = `${r.date ?? ''}|${r.prestation ?? ''}|${r.dep ?? ''}`;
      if (!dupMap.has(key)) dupMap.set(key, []);
      dupMap.get(key)!.push(r.id);
    }
    for (const [, ids] of dupMap) {
      if (ids.length > 1) {
        for (const id of ids) {
          if (filters.tmsFormId?.trim() && id !== filters.tmsFormId.trim()) continue;
          if (pc.get(id)?.has(ANOMALY_TYPE_CODES.DUPLICATION_PRESTATION)) continue;
          alerts.push({
            code: 'DUPLICATE_PRESTATION_SITE',
            severity: 'ALERTE',
            message: `Prestation / site / date en doublon sur plusieurs tournées (${ids.join(', ')})`,
            tmsFormId: id,
            meta: { relatedIds: ids },
          });
        }
      }
    }

    for (const data of rows) {
      const id = data.id;
      const tableRows = Array.isArray(data.table_rows) ? data.table_rows : [];
      const codes = pc.get(id) ?? new Set<string>();

      const kms = tableRows.map((row: any) => parseKm(row.kmArv)).filter((k): k is number => k !== null);
      for (let i = 1; i < kms.length; i++) {
        if (kms[i]! <= kms[i - 1]!) {
          alerts.push({
            code: 'KM_NON_CROISSANT',
            severity: 'BLOQUANT',
            message: `Le kilométrage client (ligne ${i + 1}) doit être supérieur au précédent (${kms[i - 1]} → ${kms[i]})`,
            tmsFormId: id,
            meta: { index: i, prev: kms[i - 1], cur: kms[i] },
          });
          break;
        }
      }

      const obs = (data.observation ?? '').trim();
      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i] as Record<string, unknown>;
        const um = parseKm(row.um);
        const pal = parseKm(row.pal);
        if (um === null || pal === null) continue;
        if (Math.abs(um - pal) > 1e-6 && !obs) {
          alerts.push({
            code: 'UNITE_PALETTE_SANS_COMMENTAIRE',
            severity: 'ALERTE',
            message: `Écart unités / palettes (ligne ${i + 1}) sans commentaire explicatif`,
            tmsFormId: id,
            meta: { rowIndex: i, um, pal },
          });
          break;
        }
      }

      const truck = (data.truck ?? '').trim();
      if (truck) {
        const hasRoute = await this.gpsService.hasRealRoute(id);
        if (!hasRoute) {
          alerts.push({
            code: 'TOURNEE_SANS_GPS',
            severity: 'ALERTE',
            message: `Camion renseigné mais pas de trace GPS suffisante (minimum ${process.env.GPS_MIN_POINTS_REAL_ROUTE ?? '3'} points)`,
            tmsFormId: id,
          });
        }
      }

      if (!(data.marchandise ?? '').trim() && !codes.has(ANOMALY_TYPE_CODES.ABSENCE_LISTE_COLISAGE)) {
        alerts.push({
          code: 'LISTE_COLISAGE_MANQUANTE',
          severity: 'INFO',
          message: 'Liste de colisage / marchandise non renseignée',
          tmsFormId: id,
        });
      }
      for (let i = 0; i < tableRows.length; i++) {
        const row = tableRows[i] as Record<string, unknown>;
        if (row.livree && !String(row.kmTh ?? '').trim()) {
          if (codes.has(ANOMALY_TYPE_CODES.ORDRE_MAGASIN_NON_CONFORME)) continue;
          alerts.push({
            code: 'ORDRE_MAGASIN_KM_TH_MANQUANT',
            severity: 'ALERTE',
            message: `Ligne ${i + 1} livrée : Km TH / ordre magasin manquant`,
            tmsFormId: id,
            meta: { rowIndex: i },
          });
        }
      }

      const march = `${data.marchandise ?? ''} ${(tableRows as any[]).map((r) => r.client).join(' ')}`;
      if (SENSITIVE_RE.test(march)) {
        for (let i = 0; i < tableRows.length; i++) {
          const row = tableRows[i] as Record<string, unknown>;
          const um = parseKm(row.um);
          const pal = parseKm(row.pal);
          if (um !== null && pal !== null && Math.abs(um - pal) < 1e-6) {
            alerts.push({
              code: 'ARTICLE_SENSIBLE_UM_EQ_PAL',
              severity: 'ALERTE',
              message: `Article sensible : UM = palettes (ligne ${i + 1}) — vérifier conditionnement`,
              tmsFormId: id,
              meta: { rowIndex: i, um, pal },
            });
          }
        }
      }
    }

    const seen = new Set<string>();
    return alerts.filter((a) => {
      const k = `${a.code}|${a.tmsFormId ?? ''}|${a.message}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
}
