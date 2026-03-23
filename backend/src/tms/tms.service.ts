import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { Repository } from 'typeorm';
import { TmsImportRow } from './entities/tms-import-row.entity';

@Injectable()
export class TmsService {
  constructor(
    @InjectRepository(TmsImportRow)
    private readonly tmsImportRowRepo: Repository<TmsImportRow>,
  ) {}

  async getData() {
    try {
      const [entriesCount, rows] = await Promise.all([
        this.tmsImportRowRepo.count(),
        this.tmsImportRowRepo.find({ order: { id: 'DESC' }, take: 50 }),
      ]);

      const list = rows.map((row) => this.mapRowToListItem(row));

      return {
        entriesCount,
        list,
        active: null,
      };
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR' && String(e?.message ?? '').includes('otsnumbdx')) {
        const rows = await this.fetchRowsWithoutOtsnumbdx();
        const list = rows.map((row) => this.mapRowToListItem(row));
        return {
          entriesCount: await this.tmsImportRowRepo.count(),
          list,
          active: null,
        };
      }
      if (e?.code === 'ER_NO_SUCH_TABLE') {
        throw new BadRequestException(
          'Missing table tms_import_rows. Run sql/schema.mysql.sql to create the DB schema.',
        );
      }
      throw e;
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
    const otsnumbdx = this.asString(row.otsnumbdx);
    if (otdcode && /^\d+$/.test(otdcode)) return otdcode;
    return otsnum ?? otsnumbdx ?? otdcode ?? null;
  }

  private mapRowToListItem(row: Partial<TmsImportRow>) {
    const tmsNumber = this.pickTmsNumber(row);
    const normalizedId = `tms-${tmsNumber ?? row.id}`;
    const date = row.cdate ?? (row.voydtd ? this.formatDateOnly(row.voydtd) : null);

    return {
      id: normalizedId,
      wms: row.otsnumbdx ?? row.otdcode ?? null,
      date,
      site: row.sitcode ?? row.sitecamion ?? row.sitechauff ?? null,
      truck: row.voycle ?? null,
      driver: row.salnom ?? '',
      dep: row.toutrafcode ?? null,
      prestation: row.plalib ?? row.artcode ?? row.chargement ?? null,
      active: false,
    };
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
      .limit(50)
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
