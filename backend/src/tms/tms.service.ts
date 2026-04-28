import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { DataSource, Repository } from 'typeorm';
import { ActivityLogService } from '../activity/activity-log.service';
import { AnomalyEvaluationService } from '../anomalies/anomaly-evaluation.service';
import { TmsImportRow } from './entities/tms-import-row.entity';
import { TmsFormData } from './entities/tms-form-data.entity';
import { resolveSiteCodeForDisplay } from './site-code-lookup';
import { ClientsPoiService } from '../clients-poi/clients-poi.service';
import { TourLegKmHistoryService } from './tour-leg-km-history.service';

@Injectable()
export class TmsService implements OnModuleDestroy {
  private tmsDbDataSource: DataSource | null = null;

  constructor(
    @InjectRepository(TmsImportRow)
    private readonly tmsImportRowRepo: Repository<TmsImportRow>,
    @InjectRepository(TmsFormData)
    private readonly formDataRepo: Repository<TmsFormData>,
    private readonly dataSource: DataSource,
    private readonly activity: ActivityLogService,
    private readonly anomalyEvaluation: AnomalyEvaluationService,
    private readonly clientsPoi: ClientsPoiService,
    private readonly tourLegKmHistory: TourLegKmHistoryService,
  ) {}

  async onModuleDestroy() {
    if (this.tmsDbDataSource?.isInitialized) {
      await this.tmsDbDataSource.destroy();
    }
  }

  private async getTmsDbDataSource(): Promise<DataSource> {
    if (this.tmsDbDataSource?.isInitialized) {
      return this.tmsDbDataSource;
    }

    const host = process.env.TMS_DB_HOST ?? process.env.DB_HOST ?? '127.0.0.1';
    const port = Number(process.env.TMS_DB_PORT ?? process.env.DB_PORT ?? '5432');
    const username = process.env.TMS_DB_USER ?? process.env.DB_USER ?? 'postgres';
    const password = process.env.TMS_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '';
    const database = process.env.TMS_DB_NAME ?? 'TMS_DB';

    this.tmsDbDataSource = new DataSource({
      type: 'postgres',
      host,
      port: Number.isFinite(port) ? port : 5432,
      username,
      password,
      database,
      synchronize: false,
      logging: false,
    });
    await this.tmsDbDataSource.initialize();
    return this.tmsDbDataSource;
  }

  private async tmsDbQuery<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    const ds = await this.getTmsDbDataSource();
    return ds.query(sql, params);
  }

  private async rtourneeQuery<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.dataSource.query(sql, params);
  }

  /** Max rows loaded for GET /api/tms (before dedupe by TMS id). Default 100000 so CSV-sized imports show fully. */
  private listMaxRows(): number {
    const n = Number(process.env.TMS_LIST_MAX_ROWS);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100_000;
  }

  /** Affichage français des km (identique au frontend). */
  private fmtKmThUi(km: number): string {
    return km.toFixed(2).replace('.', ',');
  }

  /**
   * Recherche SITCODE pour une fiche `tms-…` dans transport_data puis tms_import_rows.
   */
  private async resolveSitcodeForTmsFormId(formId: string): Promise<string | null> {
    const key = String(formId).replace(/^tms-/i, '').trim();
    if (!key) return null;

    const runTms = async (sql: string): Promise<Array<{ sitcode?: unknown }>> => {
      try {
        return await this.tmsDbQuery(sql, [key]);
      } catch {
        return [];
      }
    };

    const runRtournee = async (sql: string): Promise<Array<{ sitcode?: unknown }>> => {
      try {
        return await this.rtourneeQuery(sql, [key]);
      } catch {
        return [];
      }
    };

    let rows = await runTms(
      `SELECT sitcode FROM transport_data
       WHERE LOWER(TRIM(COALESCE(voycle::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otsnum::text, ''))) = LOWER(TRIM($1))
       LIMIT 1`,
    );
    if (!rows?.length) {
      rows = await runRtournee(
        `SELECT sitcode FROM tms_import_rows
         WHERE LOWER(TRIM(COALESCE(voycle::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(otsnum::text, ''))) = LOWER(TRIM($1))
         ORDER BY id DESC LIMIT 1`,
      );
    }
    const s = this.asString(rows?.[0]?.sitcode);
    if (!s) return null;
    return resolveSiteCodeForDisplay(s) ?? s;
  }

  /**
   Complète `kmTh` avec le **km aller-retour total** (dépôt → client → dépôt), comme le détail
   * itinéraire / cumul avec retour. POST /api/clients-poi/theoretical-km-legs.
   */
  private firstClientFromRows(rows: unknown[]): string | null {
    for (const r of rows) {
      const c = this.asString((r as Record<string, unknown>)?.client);
      if (c) return c.trim().toUpperCase();
    }
    return null;
  }

  private async enrichTableRowsKmTh(
    formId: string,
    rows: unknown[],
    siteIdHint: string | null | undefined,
  ): Promise<unknown[]> {
    if (!Array.isArray(rows) || rows.length === 0) return rows;

    const hint = resolveSiteCodeForDisplay(this.asString(siteIdHint));
    const origin = (hint != null && hint.trim() !== '' ? hint.trim() : null) ?? (await this.resolveSitcodeForTmsFormId(formId));
    if (!origin) return rows;

    const orderedCodes = rows.map((r) => this.asString((r as Record<string, unknown>)?.client) ?? '');
    if (!orderedCodes.some((c) => String(c).trim() !== '')) return rows;

    const legKms = await this.clientsPoi.theoreticalKmLegsAlongTour(origin, orderedCodes);
    return rows.map((r, i) => {
      const row = r as Record<string, unknown>;
      const km = legKms[i];
      if (km == null || !Number.isFinite(km)) return { ...row, kmTh: '' };
      return { ...row, kmTh: this.fmtKmThUi(km) };
    });
  }

  /**
   * Fetch transport_data fields to use as fallback defaults for the web form.
   * This bridges mobile-entered data into the web platform automatically.
   */
  private async fetchTransportDataDefaults(formId: string): Promise<{
    formDefaults: Record<string, string | null>;
    clientRows: unknown[];
    autoFilledFields: string[];
  }> {
    const empty = { formDefaults: {}, clientRows: [], autoFilledFields: [] };
    const key = String(formId).replace(/^tms-/i, '').trim();
    if (!key) return empty;

    try {
      const rows: any[] = await this.tmsDbQuery(
        `SELECT td.*
         FROM transport_data td
         WHERE LOWER(TRIM(COALESCE(td.voycle::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.otsnum::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.toucode::text, ''))) = LOWER(TRIM($1))
         ORDER BY td.voydtd ASC NULLS LAST, td.updated_at DESC NULLS LAST
         LIMIT 50`,
        [key],
      );
      if (!rows?.length) return empty;

      // Use the first row for header-level fields
      const first = rows[0];

      const fmtTime = (v: unknown): string | null => {
        if (v == null) return null;
        const s = String(v).trim();
        if (!s) return null;
        // TIME columns come back as "HH:MM:SS" — keep HH:MM
        const m = s.match(/^(\d{2}:\d{2})/);
        return m ? m[1] : s;
      };

      const fmtNum = (v: unknown): string | null => {
        if (v == null) return null;
        const n = Number(String(v).replace(',', '.'));
        return Number.isFinite(n) ? String(n) : null;
      };

      const formDefaults: Record<string, string | null> = {
        hDepart: fmtTime(first.voyhrd),
        kmDepart: fmtNum(first.plakm1),
        hRetour: fmtTime(first.voyhrf),
        kmRetour: fmtNum(first.plakm2),
        kmDernierClient: this.asString(first.km_dernier_client) ?? fmtNum(first.otskm2),
        marchandise: this.asString(first.chargement),
        totalPalettes: first.voypal != null ? String(first.voypal) : null,
      };

      // Track which fields actually have data from transport_data
      const autoFilledFields = Object.entries(formDefaults)
        .filter(([, v]) => v != null && String(v).trim() !== '')
        .map(([k]) => k);

      // Build client rows from all transport_data rows for this tournée
      const clientRows = rows.map((row: any, idx: number) => ({
        id: Number(row.source_transport_id ?? idx + 1),
        client: this.asString(row.otdcode) ?? '',
        dep: this.asString(row.tiecode) ?? '',
        um: this.asString(row.artcode) ?? '',
        pal: this.asString(row.entnbpal) ?? this.asString(row.voypal) ?? '',
        arrivee: fmtTime(row.arrivee_client) ?? fmtTime(row.voyhrd) ?? '',
        depart: fmtTime(row.depart_client) ?? fmtTime(row.voyhrf) ?? '',
        kmArv: this.asString(row.km_arv_client) ?? fmtNum(row.plakm2) ?? fmtNum(row.km_tsp) ?? '',
        taxe: this.asString(row.ottmt) ?? '',
        livree: false,
        kmTh: '',
        region: this.asString(row.sitcode) ?? '',
      }));

      return { formDefaults, clientRows, autoFilledFields };
    } catch {
      return empty;
    }
  }

  async getFormData(id: string) {
    try {
      const data = await this.formDataRepo.findOne({ where: { id } });

      // Always fetch transport_data defaults (even if form data exists)
      const tdDefaults = await this.fetchTransportDataDefaults(id);

      if (data) {
        let tableRows = data.table_rows ?? [];

        // If no saved table rows, use transport_data client rows as fallback
        if (!Array.isArray(tableRows) || tableRows.length === 0) {
          tableRows = tdDefaults.clientRows;
        }

        tableRows = await this.enrichTableRowsKmTh(id, tableRows as unknown[], data.siteId);

        const siteHint = data.siteId ?? (await this.resolveSitcodeForTmsFormId(id));
        const firstClient = this.firstClientFromRows(tableRows);
        const kmMoyHist =
          firstClient != null
            ? await this.tourLegKmHistory.getAverage(siteHint ?? undefined, firstClient)
            : null;
        const kmMoyUi =
          kmMoyHist != null ? this.fmtKmThUi(kmMoyHist) : data.km_moy != null ? data.km_moy : '';

        // Helper: use saved value if present, otherwise fallback to transport_data
        const or = (saved: unknown, tdKey: string): any => {
          const s = saved != null && String(saved).trim() !== '' ? saved : null;
          return s ?? tdDefaults.formDefaults[tdKey] ?? null;
        };

        // Track which fields were auto-filled from transport_data (not manually saved)
        const autoFilled: string[] = [];
        const orTrack = (saved: unknown, tdKey: string): any => {
          const s = saved != null && String(saved).trim() !== '' ? saved : null;
          if (s != null) return s;
          const fallback = tdDefaults.formDefaults[tdKey];
          if (fallback != null && String(fallback).trim() !== '') {
            autoFilled.push(tdKey);
            return fallback;
          }
          return null;
        };

        const input_data = {
          date: data.date,
          wms: data.wms,
          prestation: data.prestation,
          truck: data.truck,
          driver: data.driver,
          dep: data.dep,
          kmFacture: data.km_facture,
          marchandise: orTrack(data.marchandise, 'marchandise'),
          conformite: data.conformite,
          observation: data.observation,
          hDepart: orTrack(data.h_depart, 'hDepart'),
          kmDepart: orTrack(data.km_depart, 'kmDepart'),
          hRetour: orTrack(data.h_retour, 'hRetour'),
          kmRetour: orTrack(data.km_retour, 'kmRetour'),
          kmDernierClient: orTrack(data.km_dernier_client, 'kmDernierClient'),
          kmMoy: kmMoyUi,
          totalPalettes: orTrack(data.total_palettes, 'totalPalettes'),
          totalPalettes2: data.total_palettes_2,
          tourneeSec: data.tournee_sec,
          apresMidi: Boolean(data.apres_midi),
          interSite: Boolean(data.inter_site),
          gpsStartLat: data.gps_start_lat != null ? String(data.gps_start_lat) : '',
          gpsStartLng: data.gps_start_lng != null ? String(data.gps_start_lng) : '',
          gpsEndLat: data.gps_end_lat != null ? String(data.gps_end_lat) : '',
          gpsEndLng: data.gps_end_lng != null ? String(data.gps_end_lng) : '',
          gpsStartLabel: '',
          gpsEndLabel: '',
          prestationId: data.prestationId,
          siteId: siteHint,
          autoFilledFromMobile: autoFilled,
        };
        return {
          id: data.id,
          tms_id: data.tms_id,
          table_rows: tableRows,
          tableRows,
          input_data,
          formData: input_data,
        };
      }

      // No saved form data at all — build entirely from transport_data defaults
      const siteHint = await this.resolveSitcodeForTmsFormId(id);
      let tableRows = tdDefaults.clientRows;
      if (tableRows.length > 0) {
        tableRows = await this.enrichTableRowsKmTh(id, tableRows as unknown[], siteHint);
      }
      const firstClient = this.firstClientFromRows(tableRows);
      const kmMoyHist =
        firstClient != null
          ? await this.tourLegKmHistory.getAverage(siteHint ?? undefined, firstClient)
          : null;
      const kmMoyUi = kmMoyHist != null ? this.fmtKmThUi(kmMoyHist) : '';

      const input_data = {
        date: null,
        wms: null,
        prestation: null,
        truck: null,
        driver: null,
        dep: null,
        kmFacture: null,
        marchandise: tdDefaults.formDefaults.marchandise ?? null,
        conformite: 'Conforme',
        observation: null,
        hDepart: tdDefaults.formDefaults.hDepart ?? null,
        kmDepart: tdDefaults.formDefaults.kmDepart ?? null,
        hRetour: tdDefaults.formDefaults.hRetour ?? null,
        kmRetour: tdDefaults.formDefaults.kmRetour ?? null,
        kmDernierClient: tdDefaults.formDefaults.kmDernierClient ?? null,
        kmMoy: kmMoyUi,
        totalPalettes: tdDefaults.formDefaults.totalPalettes ?? '0',
        totalPalettes2: null,
        tourneeSec: '0',
        apresMidi: false,
        interSite: false,
        gpsStartLat: '',
        gpsStartLng: '',
        gpsEndLat: '',
        gpsEndLng: '',
        gpsStartLabel: '',
        gpsEndLabel: '',
        prestationId: null,
        siteId: siteHint,
        autoFilledFromMobile: tdDefaults.autoFilledFields,
      };
      return {
        id,
        tms_id: id,
        table_rows: tableRows,
        tableRows,
        input_data,
        formData: input_data,
      };
    } catch (e: any) {
      const sqlState = e?.sqlState ?? e?.driverError?.sqlState;
      const errno = e?.errno ?? e?.driverError?.errno;
      const msg = String(e?.message ?? e?.driverError?.message ?? '');
      if (e?.code === 'ER_NO_SUCH_TABLE' || sqlState === '42S02' || errno === 1146 || errno === 1932 || msg.includes('tms_form_data') && msg.includes("doesn't exist")) {
        throw new BadRequestException(
          "La table tms_form_data n'existe pas. Exécutez le patch SQL: backend/sql/patches/007_create_tms_form_data.sql",
        );
      }
      throw e;
    }
  }

  async saveFormData(id: string, body: any, ctx?: { ip?: string | null }) {
    try {
      let existing = await this.formDataRepo.findOne({ where: { id } });
      if (!existing) {
        existing = this.formDataRepo.create({ id, tms_id: id });
      }
      const inputs = body.input_data || {};
      
      existing.date = inputs.date || null;
      existing.wms = inputs.wms || null;
      existing.prestation = inputs.prestation || null;
      existing.truck = inputs.truck || null;
      existing.driver = inputs.driver || null;
      existing.dep = inputs.dep || null;
      existing.prestationId =
        inputs.prestationId != null && String(inputs.prestationId).trim() !== ''
          ? String(inputs.prestationId).trim()
          : null;
      existing.siteId =
        inputs.siteId != null && String(inputs.siteId).trim() !== ''
          ? String(inputs.siteId).trim()
          : null;
      existing.km_facture = inputs.kmFacture || null;
      existing.marchandise = inputs.marchandise || null;
      existing.conformite = inputs.conformite || null;
      existing.observation = inputs.observation || null;
      existing.h_depart = inputs.hDepart || null;
      existing.km_depart = inputs.kmDepart || null;
      existing.h_retour = inputs.hRetour || null;
      existing.km_retour = inputs.kmRetour || null;
      existing.km_dernier_client = inputs.kmDernierClient || null;
      existing.total_palettes = inputs.totalPalettes || null;
      existing.total_palettes_2 = inputs.totalPalettes2 || null;
      existing.tournee_sec = inputs.tourneeSec || null;
      existing.apres_midi = Boolean(inputs.apresMidi);
      existing.inter_site = Boolean(inputs.interSite);

      const toDec = (v: unknown) => {
        if (v === '' || v === null || v === undefined) return null;
        const n = Number(String(v).replace(',', '.'));
        return Number.isFinite(n) ? n.toFixed(7) : null;
      };
      existing.gps_start_lat = toDec(inputs.gpsStartLat ?? inputs.gps_start_lat) as any;
      existing.gps_start_lng = toDec(inputs.gpsStartLng ?? inputs.gps_start_lng) as any;
      existing.gps_end_lat = toDec(inputs.gpsEndLat ?? inputs.gps_end_lat) as any;
      existing.gps_end_lng = toDec(inputs.gpsEndLng ?? inputs.gps_end_lng) as any;

      const tourneeKey = this.parseTourneeKey(id);
      if (tourneeKey) {
        await this.syncTransportDataDriverFromForm(tourneeKey, existing.driver);
      }

      const rawRows = body.table_rows || [];
      existing.table_rows = (await this.enrichTableRowsKmTh(id, rawRows, existing.siteId)) as any;

      const siteForHistory = existing.siteId ?? (await this.resolveSitcodeForTmsFormId(id));
      await this.tourLegKmHistory.recordSamples(id, siteForHistory, existing.table_rows as any[]);
      const firstClientAfter = this.firstClientFromRows(existing.table_rows as unknown[]);
      const kmMoyAvg = await this.tourLegKmHistory.getAverage(siteForHistory ?? undefined, firstClientAfter);
      existing.km_moy =
        kmMoyAvg != null
          ? this.fmtKmThUi(kmMoyAvg)
          : inputs.kmMoy != null && String(inputs.kmMoy).trim() !== ''
            ? String(inputs.kmMoy).trim()
            : null;

      try {
        const saved = await this.formDataRepo.save(existing);
        await this.activity.log({
          action: 'FORM_SAVE',
          targetType: 'tms_form',
          targetId: id,
          details: {
            tms_id: saved.tms_id,
            date: saved.date,
            prestation: saved.prestation,
          },
          ip: ctx?.ip ?? null,
        });
        await this.anomalyEvaluation.evaluateAfterSave(id);
        return saved;
      } catch (e: any) {
        if (e?.code === 'ER_BAD_FIELD_ERROR' && String(e?.message ?? '').includes('gps_')) {
          delete (existing as any).gps_start_lat;
          delete (existing as any).gps_start_lng;
          delete (existing as any).gps_end_lat;
          delete (existing as any).gps_end_lng;
          const saved = await this.formDataRepo.save(existing);
          await this.activity.log({
            action: 'FORM_SAVE',
            targetType: 'tms_form',
            targetId: id,
            details: { tms_id: saved.tms_id, date: saved.date, prestation: saved.prestation, strippedGps: true },
            ip: ctx?.ip ?? null,
          });
          await this.anomalyEvaluation.evaluateAfterSave(id);
          return saved;
        }
        throw e;
      }
    } catch (e: any) {
      const sqlState = e?.sqlState ?? e?.driverError?.sqlState;
      const errno = e?.errno ?? e?.driverError?.errno;
      const msg = String(e?.message ?? e?.driverError?.message ?? '');
      if (e?.code === 'ER_NO_SUCH_TABLE' || sqlState === '42S02' || errno === 1146 || errno === 1932 || msg.includes('tms_form_data') && msg.includes("doesn't exist")) {
        throw new BadRequestException(
          "La table tms_form_data n'existe pas. Exécutez le patch SQL: backend/sql/patches/007_create_tms_form_data.sql",
        );
      }
      throw e;
    }
  }

  async getData(query: Record<string, string> = {}) {
    const hasFilters = Object.values(query).some((v) => v != null && String(v).trim() !== '');
    const take = this.listMaxRows();

    // Fetch from tms_import_rows (Excel imports)
    let importRows: Array<Partial<TmsImportRow>> = [];
    let importCount = 0;
    try {
      [importCount, importRows] = await Promise.all([
        this.tmsImportRowRepo.count(),
        this.tmsImportRowRepo.find({ order: { id: 'DESC' }, take }),
      ]);
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR' && String(e?.message ?? '').includes('otsnumbdx')) {
        importRows = await this.fetchRowsWithoutOtsnumbdx();
        importCount = await this.tmsImportRowRepo.count();
      }
      // 42P01 = postgres table does not exist — silently skip
      else if (e?.code !== '42P01' && e?.code !== 'ER_NO_SUCH_TABLE') {
        throw e;
      }
    }

    // Fetch from transport_data (migrated XAMPP data)
    const transportRows = await this.fetchTransportDataRows(take);
    const totalCount = importCount + transportRows.length;

    // transport_data: list view must be distinct by tournée/TMS key
    const transportList = this.buildListFromRows(transportRows, 'transport_data');

    // tms_import_rows: keep existing deduplication by TMS number
    const importList = this.buildListFromRows(importRows, 'tms_import_rows');

    const merged = [...transportList, ...importList];
    const byId = new Map<string, (typeof merged)[number]>();
    for (const item of merged) {
      if (!byId.has(item.id)) byId.set(item.id, item);
    }

    let list = Array.from(byId.values());
    const distinctCount = list.length;
    if (hasFilters) {
      list = this.filterListByQuery(list, query);
    }

    return {
      entriesCount: distinctCount,
      rowsCount: totalCount,
      list,
      active: null,
    };
  }

  private async fetchTransportDataRows(limit: number): Promise<Array<Partial<TmsImportRow>>> {
    try {
      const rows: any[] = await this.tmsDbQuery(
        `SELECT ROW_NUMBER() OVER (ORDER BY otsnum DESC NULLS LAST) AS _rn,
             td.affcode, td.artcode, td.cdate, td.entnbpal, td.otdcode, td.otscontainer, td.otsetat,
             td.otskm2, td.otsnumbdx, td.ottmt, td.placha1i, td.plakm1, td.plakm2, td.plalib, td.plamoti,
             td.plargiarr, td.rgilibl,
             td.salnom, td.saltel,
             td.sitcode, td.sitsiretedi, td.tiecode,
             td.toucode, td.voycle, td.voydtd, td.voyhrd, td.voypal, td.performance_camion,
             td.performance_chauffeur, td.taux_remplissage_pal, td.taux_remplissage_ton,
             td.mdate, td.sitechauff, td.sitecamion, td.salmemoe, td.otsnum, td.platouordre,
             td.salmobilite, td.km_tsp, td.toutrafcode, td.chargement, td.voydtf, td.otdhd, td.voymemo
        FROM transport_data td
        ORDER BY td.otsnum DESC NULLS LAST
         LIMIT ${limit}`,
      );
      return rows.map((r) => ({
        id: `td-${r._rn}`,
        affcode: r.affcode ?? null,
        artcode: r.artcode ?? null,
        cdate: this.asDateOnly(r.cdate),
        entnbpal: r.entnbpal ?? null,
        otdcode: r.otdcode ?? null,
        otscontainer: r.otscontainer ?? null,
        otsetat: r.otsetat ?? null,
        otskm2: r.otskm2 ?? null,
        otsnumbdx: r.otsnumbdx ?? null,
        ottmt: r.ottmt ?? null,
        placha1i: r.placha1i ?? null,
        plakm1: r.plakm1 ?? null,
        plakm2: r.plakm2 ?? null,
        plalib: r.plalib ?? null,
        plamoti: r.plamoti ?? null,
        plargiarr: r.plargiarr ?? null,
        rgilibl: r.rgilibl ?? null,
        salnom: r.salnom ?? null,
        saltel: r.saltel ?? null,
        sitcode: r.sitcode ?? null,
        sitsiretedi: r.sitsiretedi ?? null,
        tiecode: r.tiecode ?? null,
        toucode: r.toucode ?? null,
        voycle: r.voycle ?? null,
        voydtd: this.asDateOnly(r.voydtd) as any,
        voyhrd: r.voyhrd ?? null,
        voypal: r.voypal ?? null,
        performance_camion: r.performance_camion ?? null,
        performance_chauffeur: r.performance_chauffeur ?? null,
        taux_remplissage_pal: r.taux_remplissage_pal ?? null,
        taux_remplissage_ton: r.taux_remplissage_ton ?? null,
        mdate: r.mdate ? new Date(r.mdate) : null,
        sitechauff: r.sitechauff ?? null,
        sitecamion: r.sitecamion ?? null,
        salmemoe: r.salmemoe ?? null,
        otsnum: r.otsnum ?? null,
        platouordre: r.platouordre ?? null,
        salmobilite: r.salmobilite ?? null,
        km_tsp: r.km_tsp ?? null,
        toutrafcode: r.toutrafcode ?? null,
        chargement: r.chargement ?? null,
        voydtf: this.asDateOnly(r.voydtf) as any,
        otdhd: r.otdhd ?? null,
        voymemo: r.voymemo ?? null,
        raw_json: null,
      }));
    } catch {
      // Table does not exist or no access — silently return empty
      return [];
    }
  }

  async importExcel(buffer: Buffer, ctx?: { ip?: string | null }) {
    if (!buffer?.length) {
      throw new BadRequestException('Empty file');
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    } catch {
      throw new BadRequestException('Invalid Excel file');
    }

    const sheetName = workbook.SheetNames?.[0];
    if (!sheetName) {
      throw new BadRequestException('Excel file has no sheets');
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    });

    const rowsToInsert = rawRows
      .map((r) => this.mapExcelRow(r))
      .filter((r) => !this.isRowEmpty(r));

    const chunkSize = 500;
    try {
      for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        await this.tmsImportRowRepo.insert(chunk);
      }
    } catch (e: any) {
      if (e?.code === 'ER_NO_SUCH_TABLE') {
        throw new BadRequestException(
          'Missing table tms_import_rows. Run sql/schema.mysql.sql to create the DB schema.',
        );
      }
      throw e;
    }

    const result = {
      sheetName,
      rowsDetected: rawRows.length,
      inserted: rowsToInsert.length,
    };
    await this.activity.log({
      action: 'TMS_EXCEL_IMPORT',
      targetType: 'tms_import',
      details: result,
      ip: ctx?.ip ?? null,
    });
    return result;
  }

  async getTransportData(rawLimit?: string) {
    const parsedLimit = Number(rawLimit);
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(Math.floor(parsedLimit), 1000)
        : 100;

    try {
      const rows = await this.tmsDbQuery(
        `SELECT * FROM transport_data WHERE states = 'done' ORDER BY "createdAt" DESC LIMIT ${safeLimit}`,
      );

      return {
        count: Array.isArray(rows) ? rows.length : 0,
        rows: Array.isArray(rows) ? rows : [],
      };
    } catch (e: any) {
      const code = String(e?.code ?? e?.driverError?.code ?? '');
      const message = String(e?.message ?? e?.driverError?.message ?? '');
      if (
        code === '42P01' ||
        code === 'ER_NO_SUCH_TABLE' ||
        message.toLowerCase().includes('transport_data')
      ) {
        throw new BadRequestException(
          "La table transport_data n'existe pas dans la base active.",
        );
      }
      throw e;
    }
  }

  async getTransportRowsByTourneeId(rawTourneeId: string) {
    const tourneeKey = this.parseTourneeKey(rawTourneeId);
    if (!tourneeKey) {
      throw new BadRequestException('Identifiant tournée invalide');
    }

    const rows = await this.fetchTransportRowsByTournee(tourneeKey);
    return {
      tourneeId: `tms-${tourneeKey}`,
      key: tourneeKey,
      count: rows.length,
      rows,
      tableRows: this.mapTransportRowsToClientRows(rows),
    };
  }

  private normalizeHeader(header: string) {
    return header
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  private normalizeRowKeys(row: Record<string, unknown>) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      out[this.normalizeHeader(key)] = value;
    }
    return out;
  }

  private asString(value: unknown, maxLen?: number): string | null {
    if (value === null || value === undefined) return null;
    const s = String(value).trim();
    if (!s) return null;
    const lower = s.toLowerCase();
    if (lower === 'undefined' || lower === 'null' || lower === 'none') return null;
    return maxLen ? s.slice(0, maxLen) : s;
  }

  private parseTourneeKey(rawTourneeId: string): string {
    return String(rawTourneeId ?? '').replace(/^tms-/i, '').trim();
  }

  private asInt(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
    const s = String(value).trim().replace(',', '.');
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : null;
  }

  private asDecimalString(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'string') {
      const v = value.trim().toLowerCase();
      if (!v || v === 'undefined' || v === 'null' || v === 'none') return null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    const s = String(value).trim().replace(',', '.');
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? String(n) : null;
  }

  private asDateOnly(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const yyyy = value.getFullYear();
      const mm = String(value.getMonth() + 1).padStart(2, '0');
      const dd = String(value.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    const s = String(value).trim();
    const lower = s.toLowerCase();
    if (lower === 'undefined' || lower === 'null' || lower === 'none') return null;
    // supports: YYYY-MM-DD, DD/MM/YYYY, DD/MM/YYYY HH:mm:ss
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (iso.test(s)) return s;
    const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const m = s.match(fr);
    if (m) {
      const dd = m[1];
      const mm = m[2];
      const yyyy = m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    const frDt = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;
    const m2 = s.match(frDt);
    if (m2) {
      const dd = m2[1];
      const mm = m2[2];
      const yyyy = m2[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }

  private asDateTime(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const s = String(value).trim();
    const lower = s.toLowerCase();
    if (lower === 'undefined' || lower === 'null' || lower === 'none') return null;
    const frDt = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;
    const m = s.match(frDt);
    if (m) {
      const dd = m[1];
      const mm = m[2];
      const yyyy = m[3];
      const hh = m[4];
      const min = m[5];
      const ss = m[6] ?? '00';
      return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);
    }
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private mapExcelRow(row: Record<string, unknown>): Partial<TmsImportRow> {
    const r = this.normalizeRowKeys(row);
    const get = (name: string) => r[this.normalizeHeader(name)];

    return {
      affcode: this.asString(get('affcode'), 64),
      artcode: this.asString(get('artcode'), 64),
      cdate: this.asDateOnly(get('cdate')),
      entnbpal: this.asInt(get('entnbpal')),
      otdcode: this.asString(get('otdcode'), 64),
      otscontainer: this.asString(get('otscontainer'), 64),
      otsetat: this.asString(get('otsetat'), 64),
      otskm2: this.asDecimalString(get('otskm2')),
      otsnumbdx: this.asString(get('otsnumbdx'), 128),
      ottmt: this.asDecimalString(get('ottmt')),
      placha1i: this.asString(get('placha1i'), 64),
      plakm1: this.asDecimalString(get('plakm1')),
      plakm2: this.asDecimalString(get('plakm2')),
      plalib: this.asString(get('plalib'), 255),
      plamoti: this.asString(get('plamoti'), 255),
      plargiarr: this.asString(get('plargiarr'), 255),
      rgilibl: this.asString(get('rgilibl'), 255),
      salnom: this.asString(get('salnom'), 255),
      saltel: this.asString(get('saltel'), 64),
      sitcode: this.asString(get('sitcode'), 64),
      sitsiretedi: this.asString(get('sitsiretedi'), 32),
      tiecode: this.asString(get('tiecode'), 64),
      toucode: this.asString(get('toucode'), 64),
      voycle: this.asString(get('voycle'), 128),
      voydtd: this.asDateTime(get('voydtd')),
      voyhrd: this.asString(get('voyhrd'), 32),
      voypal: this.asInt(get('voypal')),
      performance_camion: this.asDecimalString(get('performance_camion')),
      performance_chauffeur: this.asDecimalString(get('performance_chauffeur')),
      taux_remplissage_pal: this.asDecimalString(get('taux_remplissage_pal')),
      taux_remplissage_ton: this.asDecimalString(get('taux_remplissage_ton')),
      mdate: this.asDateTime(get('mdate')),
      sitechauff: this.asString(get('sitechauff'), 64),
      sitecamion: this.asString(get('sitecamion'), 64),
      salmemoe: this.asString(get('salmemoe')),
      otsnum: this.asString(get('otsnum'), 128),
      platouordre: this.asInt(get('platouordre')),
      salmobilite: this.asString(get('salmobilite'), 64),
      km_tsp: this.asDecimalString(get('km_tsp')),
      toutrafcode: this.asString(get('toutrafcode'), 64),
      chargement: this.asString(get('chargement'), 255),
      voydtf: this.asDateTime(get('voydtf')),
      otdhd: this.asDateTime(get('otdhd')),
      voymemo: this.asString(get('voymemo')),
      raw_json: JSON.stringify(row),
    };
  }

  private isRowEmpty(row: Partial<TmsImportRow>) {
    // consider empty if all data fields are null/undefined except raw_json
    const { id, created_at, raw_json, ...rest } = row as any;
    return Object.values(rest).every((v) => v === null || v === undefined || v === '');
  }

  private formatDateOnly(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private pickTmsNumber(row: Partial<TmsImportRow>) {
    const voycle = this.asString(row.voycle);
    const otdcode = this.asString(row.otdcode);
    const otsnum = this.asString(row.otsnum);
    const toucode = this.asString(row.toucode);
    // Business: N° TMS = VOYCLE (clé primaire métier)
    if (voycle) return voycle;
    if (otdcode && /^\d+$/.test(otdcode)) return otdcode;
    return otsnum ?? toucode ?? null;
  }

  /**
   * Liste sidebar / dashboard : une ligne affichée = une ligne `transport_data` ou `tms_import_rows`.
   * Liens avec `client_pois` (réf. géo) : `sitcode` → site départ = `client_pois.client_code` ;
   * `otdcode` → client = même table. Km TH UI = haversine entre ces POI via l’API clients-poi.
   */
  private mapRowToListItem(row: Partial<TmsImportRow>, source?: 'transport_data' | 'tms_import_rows') {
    const tmsNumber = this.pickTmsNumber(row);
    const normalizedId = `tms-${tmsNumber ?? row.id}`;
    const date = this.normalizeUiDate((row as any).voydtd) ?? this.normalizeUiDate(row.cdate);

    return {
      id: normalizedId,
      tms: tmsNumber,
      // Business: N° WMS is always 0 in the UI dataset
      wms: '0',
      date,
      site: resolveSiteCodeForDisplay(this.asString(row.sitcode)),
      // Business: CAMION column in UI = PLAMOTI (not VOYCLE)
      truck: this.asString(row.plamoti) ?? null,
      // Business: CHAUFFEUR = SALNOM
      driver: this.asString(row.salnom) ?? '',
      /** Client / lieu chargement label (OTDCODE in DB) — used in UI “Client” column */
      otdcode: this.asString(row.otdcode) ?? null,
      // Business: DEP = TIECODE
      dep: this.asString(row.tiecode) ?? null,
      // Business: PRESTATION is a manual input field (saisie) => not read from base list rows
      prestation: null,
      source: source ?? null,
      active: false,
    };
  }

  private buildListFromRows(
    rows: Array<Partial<TmsImportRow>>,
    source?: 'transport_data' | 'tms_import_rows',
  ) {
    const map = new Map<string, ReturnType<TmsService['mapRowToListItem']>>();
    for (const row of rows) {
      const item = this.mapRowToListItem(row, source);
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  }

  private filterListByQuery(
    list: Array<ReturnType<TmsService['mapRowToListItem']>>,
    query: Record<string, string>,
  ) {
    const q = (k: string) => (query[k] ?? '').trim().toLowerCase();
    return list.filter((item) => {
      if (q('tms')) {
        const needle = q('tms');
        const idPart = String(item.id).replace(/^tms-/i, '').toLowerCase();
        if (!String(item.id).toLowerCase().includes(needle) && !idPart.includes(needle)) {
          return false;
        }
      }
      if (q('wms') && !(item.wms ?? '').toLowerCase().includes(q('wms'))) return false;
      if (q('date')) {
        const d = q('date');
        const idate = (item.date ?? '').slice(0, 10).toLowerCase();
        if (!idate.includes(d) && (item.date ?? '').toLowerCase() !== d) return false;
      }
      if (q('site')) {
        const needle = q('site');
        const s = (item.site ?? '').toLowerCase();
        if (!s.includes(needle)) return false;
      }
      if (q('truck') && !(item.truck ?? '').toLowerCase().includes(q('truck'))) return false;
      if (q('driver') && !(item.driver ?? '').toLowerCase().includes(q('driver'))) return false;
      if (q('dep') && !(item.dep ?? '').toLowerCase().includes(q('dep'))) return false;
      if (q('prestation') && !(item.prestation ?? '').toLowerCase().includes(q('prestation'))) {
        return false;
      }
      return true;
    });
  }

  private normalizeUiDate(value: unknown) {
    const s = this.asString(value);
    if (!s) return null;
    const onlyDate = s.match(/^\d{4}-\d{2}-\d{2}/);
    if (onlyDate) return onlyDate[0];
    return s;
  }

  private readOtsnumbdxFromRawJson(rawJson?: string | null) {
    if (!rawJson) return null;
    try {
      const obj = JSON.parse(rawJson);
      const value = obj?.OTSNUMBDX ?? obj?.otsnumbdx;
      return this.asString(value, 128);
    } catch {
      return null;
    }
  }

  private async fetchRowsWithoutOtsnumbdx() {
    const rawRows = await this.tmsImportRowRepo
      .createQueryBuilder('row')
      .select([
        'row.id',
        'row.otdcode',
        'row.otsnum',
        'row.cdate',
        'row.voydtd',
        'row.sitcode',
        'row.sitecamion',
        'row.sitechauff',
        'row.voycle',
        'row.salnom',
        'row.toutrafcode',
        'row.plalib',
        'row.artcode',
        'row.chargement',
        'row.raw_json',
      ])
      .orderBy('row.id', 'DESC')
      .limit(this.listMaxRows())
      .getRawMany();

    return rawRows.map((raw) => ({
      id: raw.row_id,
      otdcode: raw.row_otdcode,
      otsnum: raw.row_otsnum,
      cdate: raw.row_cdate,
      voydtd: raw.row_voydtd,
      sitcode: raw.row_sitcode,
      sitecamion: raw.row_sitecamion,
      sitechauff: raw.row_sitechauff,
      voycle: raw.row_voycle,
      salnom: raw.row_salnom,
      toutrafcode: raw.row_toutrafcode,
      plalib: raw.row_plalib,
      artcode: raw.row_artcode,
      chargement: raw.row_chargement,
      otsnumbdx: this.readOtsnumbdxFromRawJson(raw.row_raw_json),
    }));
  }

  private async fetchTransportRowsByTournee(tourneeKey: string): Promise<Array<Record<string, unknown>>> {
    try {
      const rows = await this.tmsDbQuery(
        `SELECT td.*
         FROM transport_data td
         WHERE LOWER(TRIM(COALESCE(td.voycle::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.otdcode::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.otsnum::text, ''))) = LOWER(TRIM($1))
            OR LOWER(TRIM(COALESCE(td.toucode::text, ''))) = LOWER(TRIM($1))
         ORDER BY td.voydtd ASC NULLS LAST, td.otdcode ASC NULLS LAST, td.otsnum ASC NULLS LAST`,
        [tourneeKey],
      );
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  private async findRtourneeChauffeurByName(
    fullNameRaw: string,
  ): Promise<{ fullName: string; tel: string | null } | null> {
    const fullName = this.asString(fullNameRaw, 255);
    if (!fullName) return null;

    const rows = await this.rtourneeQuery<Array<Record<string, unknown>>[number]>(
      `SELECT nom, prenom, tel
       FROM chauffeurs
       WHERE LOWER(TRIM(CONCAT(COALESCE(prenom, ''), ' ', COALESCE(nom, '')))) = LOWER(TRIM($1))
          OR LOWER(TRIM(CONCAT(COALESCE(nom, ''), ' ', COALESCE(prenom, '')))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(nom, ''))) = LOWER(TRIM($1))
       LIMIT 1`,
      [fullName],
    );

    if (!rows.length) return null;

    const prenom = this.asString(rows[0].prenom, 255) ?? '';
    const nom = this.asString(rows[0].nom, 255) ?? '';
    const normalized = `${prenom} ${nom}`.replace(/\s+/g, ' ').trim() || fullName;
    return {
      fullName: normalized,
      tel: this.asString(rows[0].tel, 64),
    };
  }

  private async resolveDriverProfileForTms(
    tourneeKey: string,
    driverName: string,
  ): Promise<{ fullName: string; tel: string | null }> {
    const tmsRows = await this.tmsDbQuery<Array<Record<string, unknown>>[number]>(
      `SELECT salnom, saltel
       FROM transport_data
       WHERE LOWER(TRIM(COALESCE(voycle::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otdcode::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otsnum::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(toucode::text, ''))) = LOWER(TRIM($1))
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 5`,
      [tourneeKey],
    );

    // Step 1: try existing TMS row driver against Rtournee
    for (const row of tmsRows) {
      const existingName = this.asString(row.salnom, 255);
      if (!existingName) continue;
      const fromRtournee = await this.findRtourneeChauffeurByName(existingName);
      if (fromRtournee) return fromRtournee;
    }

    // Step 2: fallback to submitted name
    const byInputName = await this.findRtourneeChauffeurByName(driverName);
    if (byInputName) return byInputName;

    // Step 3: missing in Rtournee -> keep name and push to TMS transport_data fields
    return {
      fullName: driverName,
      tel: this.asString(tmsRows[0]?.saltel, 64),
    };
  }

  private async syncTransportDataDriverFromForm(tourneeKey: string, driverRaw: unknown): Promise<void> {
    const driverName = this.asString(driverRaw, 255);
    if (!driverName) return;

    const profile = await this.resolveDriverProfileForTms(tourneeKey, driverName);

    const params: unknown[] = [tourneeKey];
    const updates: string[] = ['salmemoe = $2', 'salnom = $2', "mdate = TO_CHAR(NOW(), 'YYYY-MM-DD HH24:MI:SS')"];
    params.push(profile.fullName);

    if (profile.tel) {
      updates.push(`saltel = $${params.length + 1}`);
      params.push(profile.tel);
    }

    await this.tmsDbQuery(
      `UPDATE transport_data
       SET ${updates.join(', ')}
       WHERE LOWER(TRIM(COALESCE(voycle::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otdcode::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(otsnum::text, ''))) = LOWER(TRIM($1))
          OR LOWER(TRIM(COALESCE(toucode::text, ''))) = LOWER(TRIM($1))`,
      params,
    );
  }

  private mapTransportRowsToClientRows(rows: Array<Record<string, unknown>>) {
    return rows.map((row, idx) => ({
      id: Number(row.source_transport_id ?? idx + 1),
      client: this.asString(row.otdcode) ?? '',
      dep: this.asString(row.tiecode) ?? '',
      um: this.asString(row.artcode) ?? '',
      pal: this.asString(row.entnbpal) ?? this.asString(row.voypal) ?? '',
      arrivee: this.asString(row.voyhrd) ?? '',
      depart: this.asString(row.voyhrf) ?? '',
      kmArv: this.asString(row.plakm2) ?? this.asString(row.km_tsp) ?? '',
      taxe: this.asString(row.ottmt) ?? '',
      livree: false,
      kmTh: '',
      region: this.asString(row.sitcode) ?? '',
    }));
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     OPTIMISATION — analyse des écarts KM / Temps
     ═══════════════════════════════════════════════════════════════════════════ */

  private parseNum(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private parseTimeToMin(v: unknown): number | null {
    if (!v) return null;
    const s = String(v).trim();
    const parts = s.split(':');
    if (parts.length < 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  }

  /**
   * Returns full optimisation analysis for all tournées with form data.
   * Single endpoint — no N+1 queries from the frontend.
   */
  async getOptimisationData() {
    // 1. Get all form data records
    let formDataRecords: TmsFormData[] = [];
    try {
      formDataRecords = await this.formDataRepo.find({
        order: { updated_at: 'DESC' },
      });
    } catch (e: any) {
      if (e?.code === '42P01') return { stats: this.emptyStats(), rows: [] };
      throw e;
    }

    // 2. Get the TMS list for site/display info
    const tmsData = await this.getData({});
    const tmsMap = new Map(tmsData.list.map((item: any) => [item.id, item]));

    // 3. Process each form data record
    const analysis = formDataRecords.map((fd) => {
      const tmsItem: any = tmsMap.get(fd.id) ?? tmsMap.get(fd.tms_id ?? '') ?? null;
      const tableRows: any[] = Array.isArray(fd.table_rows) ? fd.table_rows : [];

      // ── KM calculations ──
      const kmFacture = this.parseNum(fd.km_facture);
      const kmDepart = this.parseNum(fd.km_depart);
      const kmDernierClient = this.parseNum(fd.km_dernier_client);
      const kmRetour = this.parseNum(fd.km_retour);

      const kmReel =
        kmFacture != null
          ? kmFacture
          : kmDernierClient != null && kmDepart != null && kmDernierClient > kmDepart
            ? Math.round((kmDernierClient - kmDepart) * 100) / 100
            : null;

      // Sum of KM théorique from table rows
      const kmTheorique = tableRows.reduce((sum, row) => {
        const v = Number(String(row?.kmTh ?? '').replace(',', '.'));
        return sum + (Number.isFinite(v) && v > 0 ? v : 0);
      }, 0);

      const decalageKm =
        kmReel != null && kmTheorique > 0
          ? Math.round((kmReel - kmTheorique) * 100) / 100
          : null;
      const decalageKmPct =
        decalageKm != null && kmTheorique > 0
          ? Math.round((decalageKm / kmTheorique) * 1000) / 10
          : null;
      // Conforme if within ±10%
      const conformiteKm = decalageKmPct != null ? Math.abs(decalageKmPct) <= 10 : null;

      // ── Timing calculations ──
      const hDep = this.parseTimeToMin(fd.h_depart);
      const hRet = this.parseTimeToMin(fd.h_retour);
      const dureeReelle = hDep != null && hRet != null && hRet > hDep ? hRet - hDep : null;

      const nbClients = tableRows.filter(
        (r: any) => r?.client && String(r.client).trim(),
      ).length;
      // Estimate: 50 km/h average speed + 20 min per client stop
      const dureeEstimee =
        kmTheorique > 0 && nbClients > 0
          ? Math.round((kmTheorique / 50) * 60 + nbClients * 20)
          : null;

      const decalageTemps =
        dureeReelle != null && dureeEstimee != null ? dureeReelle - dureeEstimee : null;
      const decalageTPct =
        decalageTemps != null && dureeEstimee != null && dureeEstimee > 0
          ? Math.round((decalageTemps / dureeEstimee) * 1000) / 10
          : null;
      // Conforme if within ±15%
      const conformiteTemps = decalageTPct != null ? Math.abs(decalageTPct) <= 15 : null;

      // ── Client details ──
      const clients = tableRows
        .filter((r: any) => r?.client && String(r.client).trim())
        .map((r: any) => ({
          code: r.client,
          livree: r.livree ?? false,
          kmArv: r.kmArv ?? '',
          kmTh: r.kmTh ?? '',
          arrivee: r.arrivee ?? '',
          depart: r.depart ?? '',
          region: r.region ?? '',
        }));

      return {
        id: fd.id,
        tmsId: fd.tms_id,
        date: fd.date ?? tmsItem?.date ?? '',
        wms: fd.wms ?? tmsItem?.wms ?? '',
        truck: fd.truck ?? tmsItem?.truck ?? '',
        driver: fd.driver ?? tmsItem?.driver ?? '',
        prestation: fd.prestation ?? '',
        site: tmsItem?.site ?? fd.siteId ?? '',
        kmReel,
        kmTheorique,
        decalageKm,
        decalageKmPct,
        conformiteKm,
        hDepart: fd.h_depart ?? '',
        hRetour: fd.h_retour ?? '',
        dureeReelle,
        dureeEstimee,
        decalageTemps,
        decalageTPct,
        conformiteTemps,
        clients,
        nbClients,
        updatedAt: fd.updated_at,
      };
    });

    // 4. Compute global stats
    const withKm = analysis.filter((a) => a.conformiteKm != null);
    const withTemps = analysis.filter((a) => a.conformiteTemps != null);

    const stats = {
      total: analysis.length,
      analyzed: analysis.filter((a) => a.kmReel != null || a.dureeReelle != null).length,
      pctKm:
        withKm.length > 0
          ? Math.round((withKm.filter((a) => a.conformiteKm).length / withKm.length) * 100)
          : 0,
      pctTemps:
        withTemps.length > 0
          ? Math.round(
              (withTemps.filter((a) => a.conformiteTemps).length / withTemps.length) * 100,
            )
          : 0,
      conformeKmCount: withKm.filter((a) => a.conformiteKm).length,
      conformeTCount: withTemps.filter((a) => a.conformiteTemps).length,
      totalWithKm: withKm.length,
      totalWithTemps: withTemps.length,
      totalKmReel: Math.round(analysis.reduce((s, a) => s + (a.kmReel ?? 0), 0) * 100) / 100,
      totalKmTh: Math.round(analysis.reduce((s, a) => s + (a.kmTheorique ?? 0), 0) * 100) / 100,
      totalDureeReelle: Math.round(analysis.reduce((s, a) => s + (a.dureeReelle ?? 0), 0)),
    };

    return { stats, rows: analysis };
  }

  private emptyStats() {
    return {
      total: 0,
      analyzed: 0,
      pctKm: 0,
      pctTemps: 0,
      conformeKmCount: 0,
      conformeTCount: 0,
      totalWithKm: 0,
      totalWithTemps: 0,
      totalKmReel: 0,
      totalKmTh: 0,
      totalDureeReelle: 0,
    };
  }
}
