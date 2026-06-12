import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ANOMALY_TYPE_CODES } from '../anomalies/anomaly-type-codes';
import { Anomaly } from '../anomalies/entities/anomaly.entity';
import { TmsFormData } from '../tms/entities/tms-form-data.entity';
import { GpsService } from '../gps/gps.service';
import { MailService } from '../mail/mail.service';

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

/** Destination for alert notifications */
const ALERT_NOTIFY_EMAIL = 'ghardadounadhir306@gmail.com';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  /** Dedup: track last sent alert fingerprint to avoid spam */
  private lastSentFingerprint = '';

  constructor(
    @InjectRepository(TmsFormData)
    private readonly formRepo: Repository<TmsFormData>,
    @InjectRepository(Anomaly)
    private readonly anomalyRepo: Repository<Anomaly>,
    private readonly gpsService: GpsService,
    private readonly mailService: MailService,
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
    const deduped = alerts.filter((a) => {
      const k = `${a.code}|${a.tmsFormId ?? ''}|${a.message}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // ── Email notification ──────────────────────────────────────────────────
    const significant = deduped.filter((a) => a.severity === 'ALERTE' || a.severity === 'BLOQUANT');
    if (significant.length > 0) {
      const fingerprint = significant.map((a) => `${a.code}|${a.tmsFormId ?? ''}|${a.message}`).sort().join(';');
      if (fingerprint !== this.lastSentFingerprint) {
        this.lastSentFingerprint = fingerprint;
        this.sendAlertEmail(significant).catch((e) =>
          this.logger.error('Failed to send alert email', e),
        );
      }
    }

    return deduped;
  }

  private async sendAlertEmail(alerts: OperationalAlert[]): Promise<void> {
    if (!this.mailService.isConfigured()) {
      this.logger.warn('SMTP not configured — skipping alert email');
      return;
    }

    const now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Tunis' });
    const sevColor = (s: AlertSeverity) =>
      s === 'BLOQUANT' ? '#dc2626' : s === 'ALERTE' ? '#f97316' : '#2563eb';
    const sevLabel = (s: AlertSeverity) =>
      s === 'BLOQUANT' ? '🚨 BLOQUANT' : s === 'ALERTE' ? '⚠️ ALERTE' : 'ℹ️ INFO';

    const rows = alerts
      .map(
        (a) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">
            <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:${sevColor(a.severity)}">${sevLabel(a.severity)}</span>
          </td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#1e293b">${a.message}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#64748b">${a.tmsFormId ?? '—'}</td>
        </tr>`,
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:40px auto">
    <tr>
      <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px 40px;border-radius:12px 12px 0 0">
        <table width="100%">
          <tr>
            <td>
              <div style="font-weight:900;font-size:24px;color:#fff;letter-spacing:-1px">🚚 LUMIERE LOGISTIQUE</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.85);margin-top:4px">Système d'alertes opérationnelles</div>
            </td>
            <td align="right">
              <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 14px;color:#fff;font-size:12px;font-weight:600">${alerts.length} alerte${alerts.length > 1 ? 's' : ''}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#fff;padding:0">
        <table width="100%" style="border-collapse:collapse">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Sévérité</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Message</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Tournée</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:20px 40px;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8">Généré automatiquement le <strong>${now}</strong> — LUMIERE Logistique TMS</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await this.mailService.sendMail({
      to: ALERT_NOTIFY_EMAIL,
      subject: `🚨 TMS — ${alerts.length} alerte${alerts.length > 1 ? 's' : ''} opérationnelle${alerts.length > 1 ? 's' : ''} (${now})`,
      html,
      text: alerts.map((a) => `[${a.severity}] ${a.message} (${a.tmsFormId ?? '—'})`).join('\n'),
    });

    this.logger.log(`Alert email sent to ${ALERT_NOTIFY_EMAIL} (${alerts.length} alerts)`);
  }
}
