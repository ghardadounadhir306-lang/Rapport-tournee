import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(TmsFormData)
    private readonly formRepo: Repository<TmsFormData>,
    private readonly gpsService: GpsService,
  ) {}

  async getAlerts(filters: { tmsFormId?: string; date?: string }): Promise<OperationalAlert[]> {
    const qb = this.formRepo.createQueryBuilder('f');
    if (filters.tmsFormId?.trim()) {
      qb.andWhere('f.id = :id', { id: filters.tmsFormId.trim() });
    }
    if (filters.date?.trim()) {
      qb.andWhere('f.date = :d', { d: filters.date.trim() });
    }
    const rows = await qb.getMany();
    const allForDup = await this.formRepo.find();
    const alerts: OperationalAlert[] = [];

    const dupMap = new Map<string, string[]>();
    for (const r of allForDup) {
      const key = `${r.date ?? ''}|${r.prestation ?? ''}|${r.dep ?? ''}`;
      if (!dupMap.has(key)) dupMap.set(key, []);
      dupMap.get(key)!.push(r.id);
    }
    for (const [, ids] of dupMap) {
      if (ids.length > 1) {
        for (const id of ids) {
          if (filters.tmsFormId?.trim() && id !== filters.tmsFormId.trim()) continue;
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

      // 1 — Kilométrage croissant (Km.Arv.Client)
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

      // 2 — Unités vs palettes + commentaire obligatoire
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

      // 3 — Tournée sans trace GPS réelle (camion renseigné)
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

      // 5 — Données manquantes
      if (!(data.marchandise ?? '').trim()) {
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
          alerts.push({
            code: 'ORDRE_MAGASIN_KM_TH_MANQUANT',
            severity: 'ALERTE',
            message: `Ligne ${i + 1} livrée : Km TH / ordre magasin manquant`,
            tmsFormId: id,
            meta: { rowIndex: i },
          });
        }
      }

      // 6 — Articles sensibles : UM = palettes
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

    // Dedupe by code+tmsFormId+message
    const seen = new Set<string>();
    return alerts.filter((a) => {
      const k = `${a.code}|${a.tmsFormId ?? ''}|${a.message}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }
}
