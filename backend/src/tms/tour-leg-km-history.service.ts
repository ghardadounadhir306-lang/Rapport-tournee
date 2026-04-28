import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TourLegKmSample } from './entities/tour-leg-km-sample.entity';
import { resolveSiteCodeForDisplay } from './site-code-lookup';

@Injectable()
export class TourLegKmHistoryService {
  constructor(
    @InjectRepository(TourLegKmSample)
    private readonly repo: Repository<TourLegKmSample>,
  ) {}

  private normalizeSite(raw: string | null | undefined): string | null {
    const s = resolveSiteCodeForDisplay(raw?.trim() ? String(raw).trim() : null) ?? (raw ? String(raw).trim() : '');
    const u = s.trim().toUpperCase();
    return u || null;
  }

  private normalizeClient(raw: unknown): string | null {
    if (raw == null) return null;
    const u = String(raw).trim().toUpperCase();
    return u || null;
  }

  private parseKmTh(raw: unknown): number | null {
    if (raw == null || raw === '') return null;
    const n = Number(String(raw).replace(',', '.').trim());
    return Number.isFinite(n) ? n : null;
  }

  /** Moyenne historique pour ce couple site / client (toutes les tournées enregistrées). */
  async getAverage(sitcodeRaw: string | null | undefined, clientCode: string | null | undefined): Promise<number | null> {
    const sc = this.normalizeSite(sitcodeRaw ?? null);
    const cc = this.normalizeClient(clientCode ?? '');
    if (!sc || !cc) return null;
    try {
      const row = await this.repo
        .createQueryBuilder('s')
        .select('AVG(s.distanceKm)', 'avg')
        .addSelect('COUNT(*)', 'cnt')
        .where('s.sitcode = :sc', { sc })
        .andWhere('s.clientCode = :cc', { cc })
        .getRawOne<{ avg: string | null; cnt: string }>();
      if (!row?.cnt || row.cnt === '0' || row.avg == null) return null;
      const v = Number(row.avg);
      return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
    } catch {
      return null;
    }
  }

  /**
   * Enregistre ou met à jour le km de chaque ligne client pour cette fiche (une entrée par tournée et par client).
   */
  async recordSamples(
    tmsFormId: string,
    sitcodeRaw: string | null | undefined,
    rows: Array<{ client?: unknown; kmTh?: unknown }>,
  ): Promise<void> {
    const base = this.normalizeSite(sitcodeRaw ?? null);
    if (!base || !Array.isArray(rows)) return;

    for (const row of rows) {
      const cc = this.normalizeClient(row?.client);
      if (!cc) continue;
      const km = this.parseKmTh(row?.kmTh);
      if (km == null) continue;
      try {
        let sample = await this.repo.findOne({
          where: { sitcode: base, clientCode: cc, tmsFormId },
        });
        if (sample) {
          sample.distanceKm = km;
          await this.repo.save(sample);
        } else {
          sample = this.repo.create({
            sitcode: base,
            clientCode: cc,
            tmsFormId,
            distanceKm: km,
          });
          await this.repo.save(sample);
        }
      } catch {
        // table absente en dev / migration non passée
      }
    }
  }
}
