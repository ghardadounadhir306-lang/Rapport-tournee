import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { LessThanOrEqual, Repository } from 'typeorm';
import { BaseTarifAugmentation } from './entities/base-tarif-augmentation.entity';
import { BaseTarifEffectiveDate } from './entities/base-tarif-effective-date.entity';
import { BaseTarif } from './entities/base-tarif.entity';

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function compact(s: string) {
  return norm(s).replace(/\s/g, '');
}

function findColumnKey(row: Record<string, unknown>, candidates: string[]): string | null {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const nc = norm(c);
    const hit = keys.find((k) => norm(k) === nc);
    if (hit) return hit;
  }
  for (const c of candidates) {
    const cc = compact(c);
    const hit = keys.find((k) => compact(k) === cc);
    if (hit) return hit;
  }
  for (const c of candidates) {
    const nc = norm(c);
    const hit = keys.find((k) => norm(k).includes(nc) || nc.includes(norm(k)));
    if (hit) return hit;
  }
  for (const c of candidates) {
    const cc = compact(c);
    const hit = keys.find((k) => compact(k).includes(cc) || cc.includes(compact(k)));
    if (hit) return hit;
  }
  return null;
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim().replace(',', '.');
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export type BaseTarifItemDto = {
  id: string;
  typeCode: string;
  distMin: number;
  distMax: number;
  capMin: number;
  capMax: number;
  tarifBase: number | null;
  tarifsParDate: Record<string, number>;
  creePar: string;
};

export type UpsertBaseTarifBody = {
  typeCode?: string;
  distMin?: number;
  distMax?: number;
  capMin?: number;
  capMax?: number;
  tarifBase?: number | null;
  tarifsParDate?: Record<string, number | null>;
  creePar?: string;
};

const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class BaseTarifService {
  constructor(
    @InjectRepository(BaseTarif)
    private readonly repo: Repository<BaseTarif>,
    @InjectRepository(BaseTarifEffectiveDate)
    private readonly dateRepo: Repository<BaseTarifEffectiveDate>,
    @InjectRepository(BaseTarifAugmentation)
    private readonly augRepo: Repository<BaseTarifAugmentation>,
  ) {}

  /** Dates affichées en colonnes : inscrites en base + toute clé YYYY-MM-JJ déjà présente dans les lignes. */
  async getEffectiveDatesList(): Promise<string[]> {
    const set = new Set<string>();
    const fromTable = await this.dateRepo.find({ order: { sortOrder: 'ASC', dateIso: 'ASC' } });
    for (const x of fromTable) {
      if (DATE_ISO_RE.test(x.dateIso)) set.add(x.dateIso);
    }
    const rows = await this.repo.find();
    for (const r of rows) {
      const t = r.tarifsParDate;
      if (t && typeof t === 'object') {
        for (const k of Object.keys(t)) {
          if (DATE_ISO_RE.test(k)) set.add(k);
        }
      }
    }
    return [...set].sort();
  }

  private normalizeDateIso(raw: string): string | null {
    const t = String(raw ?? '').trim();
    if (!DATE_ISO_RE.test(t)) return null;
    const d = new Date(`${t}T12:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return null;
    return t;
  }

  /** Enregistre une nouvelle date d’effet (colonne disponible pour les taux). */
  async addEffectiveDate(dateRaw: string): Promise<{ dates: string[] }> {
    const dateIso = this.normalizeDateIso(dateRaw);
    if (!dateIso) {
      throw new BadRequestException('Date invalide — utiliser le format AAAA-MM-JJ (ex. 2021-06-15)');
    }
    const existing = await this.dateRepo.findOne({ where: { dateIso } });
    if (!existing) {
      const rawMax = await this.dateRepo
        .createQueryBuilder('d')
        .select('COALESCE(MAX(d.sortOrder), -1)', 'm')
        .getRawOne<{ m: string }>();
      const nextOrder = Number(rawMax?.m ?? -1) + 1;
      await this.dateRepo.save(this.dateRepo.create({ dateIso, sortOrder: nextOrder }));
    }
    return { dates: await this.getEffectiveDatesList() };
  }

  /** Enregistre en catalogue les dates présentes dans des montants importés. */
  private async registerDatesFromTarifKeys(keys: string[]) {
    for (const dateIso of keys) {
      if (!DATE_ISO_RE.test(dateIso)) continue;
      const hit = await this.dateRepo.findOne({ where: { dateIso } });
      if (hit) continue;
      const rawMax = await this.dateRepo
        .createQueryBuilder('d')
        .select('COALESCE(MAX(d.sortOrder), -1)', 'm')
        .getRawOne<{ m: string }>();
      const nextOrder = Number(rawMax?.m ?? -1) + 1;
      await this.dateRepo.save(this.dateRepo.create({ dateIso, sortOrder: nextOrder }));
    }
  }

  private toDto(r: BaseTarif): BaseTarifItemDto {
    const t = r.tarifsParDate && typeof r.tarifsParDate === 'object' ? { ...r.tarifsParDate } : {};
    for (const k of Object.keys(t)) {
      if (typeof t[k] !== 'number' || !Number.isFinite(t[k])) delete t[k];
    }
    return {
      id: String(r.id),
      typeCode: r.typeCode,
      distMin: r.distMin,
      distMax: r.distMax,
      capMin: r.capMin,
      capMax: r.capMax,
      tarifBase: r.tarifBase,
      tarifsParDate: t,
      creePar: r.creePar ?? '',
    };
  }

  private validateRanges(distMin: number, distMax: number, capMin: number, capMax: number) {
    if (distMin > distMax) {
      throw new BadRequestException('DIST MIN doit être ≤ DIST MAX');
    }
    if (capMin > capMax) {
      throw new BadRequestException('CAP MIN doit être ≤ CAP MAX');
    }
  }

  async findAll(): Promise<{ count: number; items: BaseTarifItemDto[] }> {
    const rows = await this.repo.find({ order: { typeCode: 'ASC', distMin: 'ASC', capMin: 'ASC', id: 'ASC' } });
    return { count: rows.length, items: rows.map((r) => this.toDto(r)) };
  }

  /**
   * Look up the applicable tariff for a given type, distance and capacity.
   * Applies any active augmentations for the current date.
   */
  async findMatchingTarif(typeCode: string, distance: number, capacity: number): Promise<BaseTarifItemDto & { augmentationPercent: number } | null> {
    const row = await this.repo
      .createQueryBuilder('t')
      .where('t.typeCode = :typeCode', { typeCode })
      .andWhere('t.distMin <= :distance AND t.distMax >= :distance', { distance })
      .andWhere('t.capMin <= :capacity AND t.capMax >= :capacity', { capacity })
      .orderBy('t.id', 'ASC')
      .getOne();
    if (!row) return null;

    const factor = await this.getAugmentationFactor();
    const dto = this.toDto(row);
    if (factor !== 1) {
      if (dto.tarifBase != null) dto.tarifBase = Math.round(dto.tarifBase * factor * 100) / 100;
      for (const k of Object.keys(dto.tarifsParDate)) {
        dto.tarifsParDate[k] = Math.round(dto.tarifsParDate[k] * factor * 100) / 100;
      }
    }
    return { ...dto, augmentationPercent: Math.round((factor - 1) * 10000) / 100 };
  }

  async create(body: UpsertBaseTarifBody): Promise<BaseTarifItemDto> {
    const typeCode = String(body.typeCode ?? '').trim();
    if (!typeCode) throw new BadRequestException('TYPE CODE obligatoire');
    const distMin = toNum(body.distMin);
    const distMax = toNum(body.distMax);
    const capMin = toNum(body.capMin);
    const capMax = toNum(body.capMax);
    if (distMin === null || distMax === null || capMin === null || capMax === null) {
      throw new BadRequestException('DIST MIN/MAX et CAP MIN/MAX numériques obligatoires');
    }
    this.validateRanges(distMin, distMax, capMin, capMax);

    const tarifBase = body.tarifBase === undefined || body.tarifBase === null ? null : toNum(body.tarifBase);
    if (body.tarifBase !== undefined && body.tarifBase !== null && tarifBase === null) {
      throw new BadRequestException('TARIF BASE invalide');
    }

    const tarifsParDate = this.normalizeTarifsJson(body.tarifsParDate);

    const row = this.repo.create({
      typeCode,
      distMin,
      distMax,
      capMin,
      capMax,
      tarifBase,
      tarifsParDate,
      creePar: String(body.creePar ?? '').trim() || null,
    });
    const saved = await this.repo.save(row);
    await this.registerDatesFromTarifKeys(Object.keys(tarifsParDate));
    return this.toDto(saved);
  }

  private normalizeTarifsJson(raw: Record<string, number | null> | undefined): Record<string, number> {
    const out: Record<string, number> = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const [k, v] of Object.entries(raw)) {
      if (v === null || v === undefined) continue;
      const n = toNum(v);
      if (n !== null) out[k] = n;
    }
    return out;
  }

  async update(idRaw: string, body: UpsertBaseTarifBody): Promise<BaseTarifItemDto> {
    const id = String(idRaw).trim();
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`Règle id=${id} introuvable`);

    if (body.typeCode !== undefined) row.typeCode = String(body.typeCode).trim() || row.typeCode;
    if (body.distMin !== undefined || body.distMax !== undefined || body.capMin !== undefined || body.capMax !== undefined) {
      const distMin = toNum(body.distMin !== undefined ? body.distMin : row.distMin)!;
      const distMax = toNum(body.distMax !== undefined ? body.distMax : row.distMax)!;
      const capMin = toNum(body.capMin !== undefined ? body.capMin : row.capMin)!;
      const capMax = toNum(body.capMax !== undefined ? body.capMax : row.capMax)!;
      if ([distMin, distMax, capMin, capMax].some((x) => x === null || !Number.isFinite(x))) {
        throw new BadRequestException('Plages numériques invalides');
      }
      this.validateRanges(distMin, distMax, capMin, capMax);
      row.distMin = distMin;
      row.distMax = distMax;
      row.capMin = capMin;
      row.capMax = capMax;
    }
    if (body.tarifBase !== undefined) {
      row.tarifBase = body.tarifBase === null ? null : toNum(body.tarifBase);
      if (body.tarifBase !== null && row.tarifBase === null) throw new BadRequestException('TARIF BASE invalide');
    }
    if (body.tarifsParDate !== undefined) {
      row.tarifsParDate = this.normalizeTarifsJson(body.tarifsParDate);
    }
    if (body.creePar !== undefined) row.creePar = String(body.creePar ?? '').trim() || null;

    const saved = await this.repo.save(row);
    if (body.tarifsParDate !== undefined) {
      await this.registerDatesFromTarifKeys(Object.keys(saved.tarifsParDate || {}));
    }
    return this.toDto(saved);
  }

  async remove(idRaw: string): Promise<{ ok: true }> {
    const id = String(idRaw).trim();
    const res = await this.repo.delete({ id });
    if (!res.affected) throw new NotFoundException(`Règle id=${id} introuvable`);
    return { ok: true };
  }

  // ─── Augmentations / Reductions ─────────────────────────────────────

  async createAugmentation(body: {
    percent: number;
    dateEffet: string;
    appliedBy?: string;
    description?: string;
  }) {
    const percent = Number(body.percent);
    if (!Number.isFinite(percent) || percent === 0) {
      throw new BadRequestException('Pourcentage invalide (doit être un nombre ≠ 0)');
    }
    const dateEffet = this.normalizeDateIso(body.dateEffet);
    if (!dateEffet) throw new BadRequestException("Date d'effet invalide (AAAA-MM-JJ)");

    const aug = this.augRepo.create({
      percent,
      dateEffet,
      appliedBy: body.appliedBy?.trim() || null,
      description: body.description?.trim() || null,
    });
    const saved = await this.augRepo.save(aug);
    return this.toAugDto(saved);
  }

  async listAugmentations() {
    const rows = await this.augRepo.find({ order: { dateEffet: 'DESC', id: 'DESC' } });
    return rows.map((r) => this.toAugDto(r));
  }

  async deleteAugmentation(id: number) {
    const res = await this.augRepo.delete({ id });
    if (!res.affected) throw new NotFoundException(`Augmentation id=${id} introuvable`);
    return { ok: true };
  }

  /**
   * The current augmentation factor: multiply all entries where dateEffet <= today.
   */
  async getAugmentationFactor(dateIso?: string): Promise<number> {
    const today = dateIso || new Date().toISOString().slice(0, 10);
    const rows = await this.augRepo.find({
      where: { dateEffet: LessThanOrEqual(today) },
      order: { dateEffet: 'ASC', id: 'ASC' },
    });
    let factor = 1;
    for (const a of rows) {
      factor *= 1 + a.percent / 100;
    }
    return factor;
  }

  private toAugDto(r: BaseTarifAugmentation) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: r.id,
      percent: r.percent,
      dateEffet: r.dateEffet,
      appliedBy: r.appliedBy ?? '',
      description: r.description ?? '',
      active: r.dateEffet <= today,
    };
  }

  parseWorkbookBuffer(buffer: Buffer): Omit<BaseTarifItemDto, 'id'>[] {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return [];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
    const out: Omit<BaseTarifItemDto, 'id'>[] = [];

    for (const raw of rows) {
      const kType = findColumnKey(raw, ['TYPE CODE', 'Type', 'type code', 'Type code', 'type', 'TypeCode']);
      const kDistMin = findColumnKey(raw, ['DIST MIN', 'DistMin', 'dist min', 'Dist min', 'dist_min']);
      const kDistMax = findColumnKey(raw, ['DIST MAX', 'DistMax', 'dist max', 'Dist max', 'dist_max']);
      const kCapMin = findColumnKey(raw, ['CAP MIN', 'CapMin', 'cap min', 'Cap min', 'cap_min']);
      const kCapMax = findColumnKey(raw, ['CAP MAX', 'CapMax', 'cap max', 'Cap max', 'cap_max']);
      const kTarifBase = findColumnKey(raw, ['TARIF BASE', 'Tarifs', 'Tarif', 'tarif base', 'Tarif base', 'TarifBase', 'tarif', 'tarifs', 'Montant', 'Prix']);
      const kCree = findColumnKey(raw, ['CRÉE PAR', 'CREE PAR', 'cree par', 'Créé par', 'CreePar']);

      if (!kType || !kDistMin || !kDistMax || !kCapMin || !kCapMax) continue;

      const typeCode = String(raw[kType] ?? '').trim();
      const distMin = toNum(raw[kDistMin]);
      const distMax = toNum(raw[kDistMax]);
      const capMin = toNum(raw[kCapMin]);
      const capMax = toNum(raw[kCapMax]);
      if (!typeCode || distMin === null || distMax === null || capMin === null || capMax === null) continue;

      const tarifBase = kTarifBase ? toNum(raw[kTarifBase]) : null;
      const tarifsParDate: Record<string, number> = {};
      for (const key of Object.keys(raw)) {
        const kn = key.trim();
        if (DATE_ISO_RE.test(kn)) {
          const v = toNum(raw[key]);
          if (v !== null) tarifsParDate[kn] = v;
        }
      }

      out.push({
        typeCode,
        distMin,
        distMax,
        capMin,
        capMax,
        tarifBase,
        tarifsParDate,
        creePar: kCree ? String(raw[kCree] ?? '').trim() : '',
      });
    }

    return out;
  }

  async importExcel(buffer: Buffer): Promise<{ count: number }> {
    if (!buffer?.length) throw new BadRequestException('Fichier vide');
    let items: Omit<BaseTarifItemDto, 'id'>[];
    try {
      items = this.parseWorkbookBuffer(buffer);
    } catch {
      throw new BadRequestException('Impossible de lire le fichier Excel');
    }
    if (items.length === 0) {
      throw new BadRequestException(
        'Aucune ligne valide (colonnes : TYPE CODE, DIST MIN, DIST MAX, CAP MIN, CAP MAX).',
      );
    }

    const allDateKeys = new Set<string>();
    await this.repo.manager.transaction(async (em) => {
      for (const i of items) {
        this.validateRanges(i.distMin, i.distMax, i.capMin, i.capMax);
        for (const k of Object.keys(i.tarifsParDate || {})) {
          if (DATE_ISO_RE.test(k)) allDateKeys.add(k);
        }
        await em.save(
          em.create(BaseTarif, {
            typeCode: i.typeCode,
            distMin: i.distMin,
            distMax: i.distMax,
            capMin: i.capMin,
            capMax: i.capMax,
            tarifBase: i.tarifBase,
            tarifsParDate: i.tarifsParDate,
            creePar: i.creePar || null,
          }),
        );
      }
    });

    await this.registerDatesFromTarifKeys([...allDateKeys]);

    return { count: items.length };
  }
}
