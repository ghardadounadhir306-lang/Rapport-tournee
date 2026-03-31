import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { DataSource, Repository } from 'typeorm';
import { TmsImportRow } from './entities/tms-import-row.entity';
import { TmsFormData } from './entities/tms-form-data.entity';

@Injectable()
export class TmsService {
  constructor(
    @InjectRepository(TmsImportRow)
    private readonly tmsImportRowRepo: Repository<TmsImportRow>,
    @InjectRepository(TmsFormData)
    private readonly formDataRepo: Repository<TmsFormData>,
    private readonly dataSource: DataSource,
  ) {}

  /** Max rows loaded for GET /api/tms (before dedupe by TMS id). Default 100000 so CSV-sized imports show fully. */
  private listMaxRows(): number {
    const n = Number(process.env.TMS_LIST_MAX_ROWS);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100_000;
  }

  async getFormData(id: string) {
    try {
      const data = await this.formDataRepo.findOne({ where: { id } });
      if (data) {
        const input_data = {
          date: data.date,
          wms: data.wms,
          prestation: data.prestation,
          truck: data.truck,
          driver: data.driver,
          dep: data.dep,
          kmFacture: data.km_facture,
          marchandise: data.marchandise,
          conformite: data.conformite,
          observation: data.observation,
          hDepart: data.h_depart,
          kmDepart: data.km_depart,
          hRetour: data.h_retour,
          kmRetour: data.km_retour,
          kmDernierClient: data.km_dernier_client,
          kmMoy: data.km_moy,
          totalPalettes: data.total_palettes,
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
        };
        const tableRows = data.table_rows ?? [];
        return {
          id: data.id,
          tms_id: data.tms_id,
          table_rows: tableRows,
          tableRows,
          input_data,
          formData: input_data,
        };
      }
      return { id, tms_id: id, table_rows: [], tableRows: [], input_data: {}, formData: {} };
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

  async saveFormData(id: string, body: any) {
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
      existing.km_facture = inputs.kmFacture || null;
      existing.marchandise = inputs.marchandise || null;
      existing.conformite = inputs.conformite || null;
      existing.observation = inputs.observation || null;
      existing.h_depart = inputs.hDepart || null;
      existing.km_depart = inputs.kmDepart || null;
      existing.h_retour = inputs.hRetour || null;
      existing.km_retour = inputs.kmRetour || null;
      existing.km_dernier_client = inputs.kmDernierClient || null;
      existing.km_moy = inputs.kmMoy || null;
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

      existing.table_rows = body.table_rows || [];
      
      try {
        return await this.formDataRepo.save(existing);
      } catch (e: any) {
        if (e?.code === 'ER_BAD_FIELD_ERROR' && String(e?.message ?? '').includes('gps_')) {
          delete (existing as any).gps_start_lat;
          delete (existing as any).gps_start_lng;
          delete (existing as any).gps_end_lat;
          delete (existing as any).gps_end_lng;
          return await this.formDataRepo.save(existing);
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

    // transport_data: each row is its own entry — no deduplication (id already unique via ROW_NUMBER)
    const transportList = transportRows.map((row) => this.mapRowToListItem(row));

    // tms_import_rows: keep existing deduplication by TMS number
    const importList = this.buildListFromRows(importRows);

    let list = [...transportList, ...importList];
    if (hasFilters) {
      list = this.filterListByQuery(list, query);
    }

    return {
      entriesCount: totalCount,
      list,
      active: null,
    };
  }

  private async fetchTransportDataRows(limit: number): Promise<Array<Partial<TmsImportRow>>> {
    try {
      const rows: any[] = await this.dataSource.query(
        `SELECT ROW_NUMBER() OVER (ORDER BY otsnum DESC NULLS LAST) AS _rn,
                affcode, artcode, cdate, entnbpal, otdcode, otscontainer, otsetat,
                otskm2, otsnumbdx, ottmt, placha1i, plakm1, plakm2, plalib, plamoti,
                plargiarr, rgilibl, salnom, saltel, sitcode, sitsiretedi, tiecode,
                toucode, voycle, voydtd, voyhrd, voypal, performance_camion,
                performance_chauffeur, taux_remplissage_pal, taux_remplissage_ton,
                mdate, sitechauff, sitecamion, salmemoe, otsnum, platouordre,
                salmobilite, km_tsp, toutrafcode, chargement, voydtf, otdhd, voymemo
         FROM transport_data
         ORDER BY otsnum DESC NULLS LAST
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
        voydtd: r.voydtd ? new Date(r.voydtd) : null,
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
        voydtf: r.voydtf ? new Date(r.voydtf) : null,
        otdhd: r.otdhd ?? null,
        voymemo: r.voymemo ?? null,
        raw_json: null,
      }));
    } catch {
      // Table does not exist or no access — silently return empty
      return [];
    }
  }

  async importExcel(buffer: Buffer) {
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

    return {
      sheetName,
      rowsDetected: rawRows.length,
      inserted: rowsToInsert.length,
    };
  }

  async getTransportData(rawLimit?: string) {
    const parsedLimit = Number(rawLimit);
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(Math.floor(parsedLimit), 1000)
        : 100;

    try {
      const rows = await this.dataSource.query(
        `SELECT * FROM transport_data LIMIT ${safeLimit}`,
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
    const otdcode = this.asString(row.otdcode);
    const otsnum = this.asString(row.otsnum);
    const toucode = this.asString(row.toucode);
    if (otdcode && /^\d+$/.test(otdcode)) return otdcode;
    return otsnum ?? toucode ?? null;
  }

  private mapRowToListItem(row: Partial<TmsImportRow>) {
    const tmsNumber = this.pickTmsNumber(row);
    const normalizedId = `tms-${tmsNumber ?? row.id}`;
    const date = this.normalizeUiDate(row.cdate) ?? (row.voydtd ? this.formatDateOnly(row.voydtd) : null);

    return {
      id: normalizedId,
      tms: tmsNumber,
      wms: this.asString(row.otsnumbdx) ?? null,
      date,
      site: this.asString(row.sitcode) ?? this.asString(row.sitecamion) ?? this.asString(row.sitechauff) ?? null,
      truck: this.asString(row.voycle) ?? null,
      driver: this.asString(row.salnom) ?? '',
      /** Client / lieu chargement label (OTDCODE in DB) — used in UI “Client” column */
      otdcode: this.asString(row.otdcode) ?? null,
      dep: this.asString(row.toutrafcode) ?? null,
      prestation: this.asString(row.plalib) ?? this.asString(row.artcode) ?? this.asString(row.chargement) ?? null,
      active: false,
    };
  }

  private buildListFromRows(rows: Array<Partial<TmsImportRow>>) {
    const map = new Map<string, ReturnType<TmsService['mapRowToListItem']>>();
    for (const row of rows) {
      const item = this.mapRowToListItem(row);
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
      if (q('site') && !(item.site ?? '').toLowerCase().includes(q('site'))) return false;
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
}
