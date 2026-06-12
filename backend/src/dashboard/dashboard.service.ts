import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService implements OnModuleDestroy {
  private tmsDs: DataSource | null = null;

  constructor(private readonly rtourneeDs: DataSource) {}

  async onModuleDestroy() {
    if (this.tmsDs?.isInitialized) await this.tmsDs.destroy();
  }

  /* ─── helpers ──────────────────────────────────────────────── */
  private async getTmsDs(): Promise<DataSource> {
    if (this.tmsDs?.isInitialized) return this.tmsDs;
    this.tmsDs = new DataSource({
      type: 'postgres',
      host: process.env.TMS_DB_HOST ?? process.env.DB_HOST ?? '127.0.0.1',
      port: Number(process.env.TMS_DB_PORT ?? process.env.DB_PORT ?? '5432'),
      username: process.env.TMS_DB_USER ?? process.env.DB_USER ?? 'postgres',
      password: process.env.TMS_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '',
      database: process.env.TMS_DB_NAME ?? 'TMS_DB',
      synchronize: false,
      logging: false,
    });
    await this.tmsDs.initialize();
    return this.tmsDs;
  }

  private async tmsQuery<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    const ds = await this.getTmsDs();
    return ds.query(sql, params) as Promise<T[]>;
  }

  private async rtourneeQuery<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.rtourneeDs.query(sql, params) as Promise<T[]>;
  }

  /* ─── main stats ─────────────────────────────────────────────── */
  async getStats(periodeStr: string) {
    const jours = Math.min(365, Math.max(1, parseInt(periodeStr) || 30));

    // ── 1. Tournées par jour (TMS DB) ──────────────────────────────
    const parJourRows: any[] = await this.tmsQuery(`
      SELECT
        voydtd::date AS jour,
        COUNT(DISTINCT COALESCE(NULLIF(voycle,''), NULLIF(otsnum,''), NULLIF(toucode,''))) AS total
      FROM transport_data
      WHERE voydtd IS NOT NULL
        AND voydtd::date >= CURRENT_DATE - ($1 || ' days')::interval
        AND voydtd::date <= CURRENT_DATE
      GROUP BY 1
      ORDER BY 1 ASC
    `, [jours]);

    // ── 2. Saisies par jour (Rtournee DB – tms_form_data) ──────────
    const saisiesJourRows: any[] = await this.rtourneeQuery(`
      SELECT
        COALESCE(NULLIF(date,''), created_at::date::text) AS jour,
        COUNT(*) AS saisies
      FROM tms_form_data
      WHERE created_at >= CURRENT_DATE - ($1 || ' days')::interval
      GROUP BY 1
      ORDER BY 1 ASC
    `, [jours]);

    // ── 3. Taux de saisie par jour (merge) ─────────────────────────
    const jourMap = new Map<string, { total: number; saisies: number }>();
    for (const r of parJourRows) {
      const j = String(r.jour).slice(0, 10);
      jourMap.set(j, { total: Number(r.total), saisies: 0 });
    }
    for (const r of saisiesJourRows) {
      const j = String(r.jour ?? '').slice(0, 10);
      if (!j) continue;
      const existing = jourMap.get(j) ?? { total: 0, saisies: 0 };
      jourMap.set(j, { ...existing, saisies: Number(r.saisies) });
    }
    const tauxSaisieParJour = Array.from(jourMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jour, v]) => ({
        jour,
        total: v.total,
        saisies: v.saisies,
        taux: v.total > 0 ? Math.round((v.saisies / v.total) * 1000) / 10 : 0,
      }));

    // ── 4. KM (tarif) par jour ─────────────────────────────────────
    const tarifJourRows: any[] = await this.tmsQuery(`
      SELECT
        voydtd::date AS jour,
        ROUND(SUM(
          CASE WHEN km_tsp IS NOT NULL AND km_tsp::text ~ '^[0-9]+(\\.[0-9]+)?$'
               THEN CAST(km_tsp AS NUMERIC) ELSE 0 END
        )::NUMERIC, 2) AS total_km
      FROM transport_data
      WHERE voydtd IS NOT NULL
        AND voydtd::date >= CURRENT_DATE - ($1 || ' days')::interval
        AND voydtd::date <= CURRENT_DATE
      GROUP BY 1
      ORDER BY 1 ASC
    `, [jours]);

    // ── 5. KM (tarif) par mois ─────────────────────────────────────
    const tarifMoisRows: any[] = await this.tmsQuery(`
      SELECT
        TO_CHAR(voydtd::date, 'YYYY-MM') AS mois,
        ROUND(SUM(
          CASE WHEN km_tsp IS NOT NULL AND km_tsp::text ~ '^[0-9]+(\\.[0-9]+)?$'
               THEN CAST(km_tsp AS NUMERIC) ELSE 0 END
        )::NUMERIC, 2) AS total_km
      FROM transport_data
      WHERE voydtd IS NOT NULL
        AND voydtd::date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY 1
      ORDER BY 1 ASC
    `);

    // ── 6. Mobilité chauffeur (saisies par chauffeur vs total tms_form) ──
    const saisiesChaufRows: any[] = await this.rtourneeQuery(`
      SELECT
        TRIM(driver) AS driver,
        COUNT(*) AS saisies
      FROM tms_form_data
      WHERE driver IS NOT NULL AND TRIM(driver) != ''
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 20
    `);

    const tourneesChaufRows: any[] = await this.tmsQuery(`
      SELECT
        TRIM(salmemoe) AS driver,
        COUNT(DISTINCT COALESCE(NULLIF(voycle,''), NULLIF(otsnum,''))) AS total
      FROM transport_data
      WHERE salmemoe IS NOT NULL AND TRIM(salmemoe) != ''
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 20
    `);

    const totalSaisies = saisiesChaufRows.reduce((s, r) => s + Number(r.saisies), 0);
    const mobiliteParChauffeur = saisiesChaufRows.map((r) => {
      const matched = tourneesChaufRows.find(
        (t) => t.driver?.toLowerCase() === r.driver?.toLowerCase(),
      );
      return {
        driver: r.driver,
        saisies: Number(r.saisies),
        total: matched ? Number(matched.total) : null,
        tauxMobilite:
          totalSaisies > 0 ? Math.round((Number(r.saisies) / totalSaisies) * 1000) / 10 : 0,
      };
    });

    // ── 7. Totaux globaux ──────────────────────────────────────────
    const globalTms: any[] = await this.tmsQuery(`
      SELECT
        COUNT(DISTINCT COALESCE(NULLIF(voycle,''), NULLIF(otsnum,''))) AS total_tournees,
        COUNT(DISTINCT TRIM(salmemoe)) FILTER (WHERE salmemoe IS NOT NULL AND TRIM(salmemoe) != '') AS total_chauffeurs,
        ROUND(SUM(
          CASE WHEN km_tsp IS NOT NULL AND km_tsp::text ~ '^[0-9]+(\\.[0-9]+)?$'
               THEN CAST(km_tsp AS NUMERIC) ELSE 0 END
        )::NUMERIC, 2) AS total_km_global
      FROM transport_data
    `);

    const globalSaisies: any[] = await this.rtourneeQuery(
      'SELECT COUNT(*) AS total_saisies FROM tms_form_data',
    );

    const g = globalTms[0] ?? {};
    const totalTournees = Number(g.total_tournees ?? 0);
    const totalFormes = Number(globalSaisies[0]?.total_saisies ?? 0);

    return {
      periode: jours,
      global: {
        totalTournees,
        totalSaisies: totalFormes,
        totalChauffeurs: Number(g.total_chauffeurs ?? 0),
        totalKm: Number(g.total_km_global ?? 0),
        tauxSaisieGlobal:
          totalTournees > 0 ? Math.round((totalFormes / totalTournees) * 1000) / 10 : 0,
      },
      tauxSaisieParJour,
      tarifParJour: tarifJourRows.map((r) => ({
        jour: String(r.jour).slice(0, 10),
        km: Number(r.total_km),
      })),
      tarifParMois: tarifMoisRows.map((r) => ({
        mois: r.mois,
        km: Number(r.total_km),
      })),
      mobiliteParChauffeur,
    };
  }
}
