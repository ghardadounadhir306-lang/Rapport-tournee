import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { Repository } from 'typeorm';
import { BaseCamion } from './entities/base-camion.entity';

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function findColumnKey(row: Record<string, unknown>, candidates: string[]): string | null {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const nc = norm(c);
    const hit = keys.find((k) => norm(k) === nc);
    if (hit) return hit;
  }
  for (const c of candidates) {
    const nc = norm(c);
    const hit = keys.find((k) => norm(k).includes(nc) || nc.includes(norm(k)));
    if (hit) return hit;
  }
  return null;
}

export type BaseCamionItemDto = {
  id: string;
  camion: string;
  marque: string;
  site: string;
  type: string;
  affectation: string;
  capacite: string;
  utile: string;
};

export type UpsertBaseCamionBody = {
  camion?: string;
  marque?: string;
  site?: string;
  type?: string;
  affectation?: string;
  capacite?: string;
  utile?: string;
};

function normCamion(s: unknown): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

@Injectable()
export class BaseCamionService {
  constructor(
    @InjectRepository(BaseCamion)
    private readonly repo: Repository<BaseCamion>,
  ) {}

  private toDto(r: BaseCamion): BaseCamionItemDto {
    return {
      id: String(r.id),
      camion: r.camion,
      marque: r.marque ?? '',
      site: r.site ?? '',
      type: r.typeCamion ?? '',
      affectation: r.affectation ?? '',
      capacite: r.capacite ?? '',
      utile: r.utile ?? '',
    };
  }

  async findAll(): Promise<{ count: number; items: BaseCamionItemDto[] }> {
    const rows = await this.repo.find({ order: { camion: 'ASC' } });
    return { count: rows.length, items: rows.map((r) => this.toDto(r)) };
  }

  async create(body: UpsertBaseCamionBody): Promise<BaseCamionItemDto> {
    const camion = normCamion(body.camion);
    if (!camion) {
      throw new BadRequestException('Immatriculation (camion) obligatoire');
    }
    const exists = await this.repo.findOne({ where: { camion } });
    if (exists) {
      throw new BadRequestException(`Le camion « ${camion} » existe déjà`);
    }
    const row = this.repo.create({
      camion,
      marque: String(body.marque ?? '').trim() || null,
      site: String(body.site ?? '').trim() || null,
      typeCamion: String(body.type ?? '').trim() || null,
      affectation: String(body.affectation ?? '').trim() || null,
      capacite: String(body.capacite ?? '').trim() || null,
      utile: String(body.utile ?? '').trim() || null,
    });
    const saved = await this.repo.save(row);
    return this.toDto(saved);
  }

  async update(idRaw: string, body: UpsertBaseCamionBody): Promise<BaseCamionItemDto> {
    const id = String(idRaw).trim();
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Camion id=${id} introuvable`);
    }
    if (body.camion !== undefined) {
      const camion = normCamion(body.camion);
      if (!camion) {
        throw new BadRequestException('Immatriculation (camion) obligatoire');
      }
      if (camion !== row.camion) {
        const clash = await this.repo.findOne({ where: { camion } });
        if (clash && String(clash.id) !== id) {
          throw new BadRequestException(`Le camion « ${camion} » existe déjà`);
        }
      }
      row.camion = camion;
    }
    if (body.marque !== undefined) row.marque = String(body.marque ?? '').trim() || null;
    if (body.site !== undefined) row.site = String(body.site ?? '').trim() || null;
    if (body.type !== undefined) row.typeCamion = String(body.type ?? '').trim() || null;
    if (body.affectation !== undefined) row.affectation = String(body.affectation ?? '').trim() || null;
    if (body.capacite !== undefined) row.capacite = String(body.capacite ?? '').trim() || null;
    if (body.utile !== undefined) row.utile = String(body.utile ?? '').trim() || null;

    const saved = await this.repo.save(row);
    return this.toDto(saved);
  }

  async remove(idRaw: string): Promise<{ ok: true }> {
    const id = String(idRaw).trim();
    const res = await this.repo.delete({ id });
    if (!res.affected) {
      throw new NotFoundException(`Camion id=${id} introuvable`);
    }
    return { ok: true };
  }

  parseWorkbookBuffer(buffer: Buffer): BaseCamionItemDto[] {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return [];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
    const out = new Map<string, BaseCamionItemDto>();

    for (const raw of rows) {
      const kCamion = findColumnKey(raw, ['CAMION', 'Camion', 'camion', 'immat', 'plaque']);
      if (!kCamion) continue;
      const camion = normCamion(raw[kCamion]);
      if (!camion || camion === '—') continue;

      const kMarque = findColumnKey(raw, ['MARQUE', 'Marque', 'marque', 'brand']);
      const kSite = findColumnKey(raw, ['SITE', 'Site', 'site']);
      const kType = findColumnKey(raw, ['TYPE', 'Type', 'type']);
      const kAff = findColumnKey(raw, ['AFFECTATION', 'Affectation', 'affectation', 'aff']);
      const kCap = findColumnKey(raw, ['CAPACITÉ', 'CAPACITE', 'Capacité', 'capacite', 'cap']);
      const kUtile = findColumnKey(raw, ['UTILE', 'Utile', 'utile', 'util']);

      out.set(camion.toLowerCase(), {
        id: '',
        camion,
        marque: kMarque ? String(raw[kMarque] ?? '').trim() : '',
        site: kSite ? String(raw[kSite] ?? '').trim() : '',
        type: kType ? String(raw[kType] ?? '').trim() : '',
        affectation: kAff ? String(raw[kAff] ?? '').trim() : '',
        capacite: kCap ? String(raw[kCap] ?? '').trim() : '',
        utile: kUtile ? String(raw[kUtile] ?? '').trim() : '',
      });
    }

    return [...out.values()];
  }

  /** Import ou fusion par immatriculation (upsert). */
  async importExcel(buffer: Buffer): Promise<{ count: number }> {
    if (!buffer?.length) {
      throw new BadRequestException('Fichier vide');
    }
    let items: BaseCamionItemDto[];
    try {
      items = this.parseWorkbookBuffer(buffer);
    } catch {
      throw new BadRequestException('Impossible de lire le fichier Excel');
    }
    if (items.length === 0) {
      throw new BadRequestException(
        'Aucune ligne valide (colonne CAMION obligatoire ; MARQUE, SITE, TYPE, etc. optionnels).',
      );
    }

    await this.repo.manager.transaction(async (em) => {
      for (const i of items) {
        const existing = await em.findOne(BaseCamion, { where: { camion: i.camion } });
        if (existing) {
          existing.marque = i.marque || null;
          existing.site = i.site || null;
          existing.typeCamion = i.type || null;
          existing.affectation = i.affectation || null;
          existing.capacite = i.capacite || null;
          existing.utile = i.utile || null;
          await em.save(existing);
        } else {
          await em.save(
            em.create(BaseCamion, {
              camion: i.camion,
              marque: i.marque || null,
              site: i.site || null,
              typeCamion: i.type || null,
              affectation: i.affectation || null,
              capacite: i.capacite || null,
              utile: i.utile || null,
            }),
          );
        }
      }
    });

    return { count: items.length };
  }
}
