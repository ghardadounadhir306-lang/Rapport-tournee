import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { In, Repository } from 'typeorm';
import { Depot } from './entities/depot.entity';
import { ClientPoint } from './entities/client-point.entity';
import { isWarehouseCode } from './warehouse-codes';
import { haversineKm } from './geo';
import { osrmDrivingKm } from './osrm-route';

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

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim().replace(',', '.');
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export type ClientPoiItemDto = {
  code: string;
  nom: string;
  lat: number;
  lng: number;
  isDepot: boolean;
  source: string;
  groupe: string;
  creePar: string;
};

export type UpsertClientPoiBody = {
  code?: string;
  nom?: string;
  latitude?: number;
  longitude?: number;
  /** true → dépôt, false (défaut) → magasin client */
  isDepot?: boolean;
  source?: string;
  groupe?: string;
  creePar?: string;
};

function normCode(s: unknown): string {
  return String(s ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

// ─── helper: convert a Depot row to the shared DTO ──────────────────────────
function depotToDto(r: Depot): ClientPoiItemDto {
  return {
    code: r.code,
    nom: r.name ?? '',
    lat: r.latitude,
    lng: r.longitude,
    isDepot: true,
    source: r.source ?? '',
    groupe: r.groupe ?? '',
    creePar: r.creePar ?? '',
  };
}

// ─── helper: convert a ClientPoint row to the shared DTO ────────────────────
function clientToDto(r: ClientPoint): ClientPoiItemDto {
  return {
    code: r.code,
    nom: r.name ?? '',
    lat: r.latitude,
    lng: r.longitude,
    isDepot: false,
    source: r.source ?? '',
    groupe: r.groupe ?? '',
    creePar: r.creePar ?? '',
  };
}

@Injectable()
export class ClientsPoiService {
  constructor(
    @InjectRepository(Depot)
    private readonly depotRepo: Repository<Depot>,
    @InjectRepository(ClientPoint)
    private readonly clientRepo: Repository<ClientPoint>,
  ) {}

  // ─── READ ─────────────────────────────────────────────────────────────────

  async findAll(): Promise<{ count: number; items: ClientPoiItemDto[] }> {
    const [depots, clients] = await Promise.all([
      this.depotRepo.find({ order: { code: 'ASC' } }),
      this.clientRepo.find({ order: { code: 'ASC' } }),
    ]);
    const items = [
      ...depots.map(depotToDto),
      ...clients.map(clientToDto),
    ].sort((a, b) => a.code.localeCompare(b.code));
    return { count: items.length, items };
  }

  async findAllDepots(): Promise<{ count: number; items: ClientPoiItemDto[] }> {
    const rows = await this.depotRepo.find({ order: { code: 'ASC' } });
    return { count: rows.length, items: rows.map(depotToDto) };
  }

  async findAllClients(): Promise<{ count: number; items: ClientPoiItemDto[] }> {
    const rows = await this.clientRepo.find({ order: { code: 'ASC' } });
    return { count: rows.length, items: rows.map(clientToDto) };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────

  async create(body: UpsertClientPoiBody): Promise<ClientPoiItemDto> {
    const code = normCode(body.code);
    if (!code) throw new BadRequestException('Code client obligatoire');

    const lat = toNum(body.latitude);
    const lng = toNum(body.longitude);
    if (lat === null || lng === null)
      throw new BadRequestException('Latitude et longitude valides obligatoires');

    const nom = String(body.nom ?? '').trim();
    const isDepot = body.isDepot === true || isWarehouseCode(code);

    if (isDepot) {
      const exists = await this.depotRepo.findOne({ where: { code } });
      if (exists) throw new BadRequestException(`Le dépôt « ${code} » existe déjà`);
      const row = this.depotRepo.create({
        code,
        name: nom || null,
        latitude: lat,
        longitude: lng,
        source: String(body.source ?? '').trim() || null,
        groupe: String(body.groupe ?? '').trim() || null,
        creePar: String(body.creePar ?? '').trim() || null,
      });
      return depotToDto(await this.depotRepo.save(row));
    } else {
      const exists = await this.clientRepo.findOne({ where: { code } });
      if (exists) throw new BadRequestException(`Le client « ${code} » existe déjà`);
      const row = this.clientRepo.create({
        code,
        name: nom || null,
        latitude: lat,
        longitude: lng,
        source: String(body.source ?? '').trim() || null,
        groupe: String(body.groupe ?? '').trim() || null,
        creePar: String(body.creePar ?? '').trim() || null,
      });
      return clientToDto(await this.clientRepo.save(row));
    }
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────

  async update(codeRaw: string, body: UpsertClientPoiBody): Promise<ClientPoiItemDto> {
    const code = normCode(codeRaw);
    if (!code) throw new BadRequestException('Code manquant');

    // Try depot first, then client
    const depotRow = await this.depotRepo.findOne({ where: { code } });
    if (depotRow) {
      if (body.nom !== undefined) depotRow.name = String(body.nom ?? '').trim() || null;
      if (body.latitude !== undefined || body.longitude !== undefined) {
        const lat = body.latitude !== undefined ? toNum(body.latitude) : toNum(depotRow.latitude);
        const lng = body.longitude !== undefined ? toNum(body.longitude) : toNum(depotRow.longitude);
        if (lat === null || lng === null)
          throw new BadRequestException('Latitude et longitude valides obligatoires');
        depotRow.latitude = lat;
        depotRow.longitude = lng;
      }
      if (body.source !== undefined) depotRow.source = String(body.source ?? '').trim() || null;
      if (body.groupe !== undefined) depotRow.groupe = String(body.groupe ?? '').trim() || null;
      if (body.creePar !== undefined) depotRow.creePar = String(body.creePar ?? '').trim() || null;
      return depotToDto(await this.depotRepo.save(depotRow));
    }

    const clientRow = await this.clientRepo.findOne({ where: { code } });
    if (clientRow) {
      if (body.nom !== undefined) clientRow.name = String(body.nom ?? '').trim() || null;
      if (body.latitude !== undefined || body.longitude !== undefined) {
        const lat = body.latitude !== undefined ? toNum(body.latitude) : toNum(clientRow.latitude);
        const lng = body.longitude !== undefined ? toNum(body.longitude) : toNum(clientRow.longitude);
        if (lat === null || lng === null)
          throw new BadRequestException('Latitude et longitude valides obligatoires');
        clientRow.latitude = lat;
        clientRow.longitude = lng;
      }
      if (body.source !== undefined) clientRow.source = String(body.source ?? '').trim() || null;
      if (body.groupe !== undefined) clientRow.groupe = String(body.groupe ?? '').trim() || null;
      if (body.creePar !== undefined) clientRow.creePar = String(body.creePar ?? '').trim() || null;
      return clientToDto(await this.clientRepo.save(clientRow));
    }

    throw new NotFoundException(`POI « ${code} » introuvable`);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────

  async remove(codeRaw: string): Promise<{ ok: true }> {
    const code = normCode(codeRaw);
    if (!code) throw new BadRequestException('Code manquant');

    const resDepot = await this.depotRepo.delete({ code });
    if (resDepot.affected) return { ok: true };

    const resClient = await this.clientRepo.delete({ code });
    if (resClient.affected) return { ok: true };

    throw new NotFoundException(`POI « ${code} » introuvable`);
  }

  // ─── EXCEL PARSE ─────────────────────────────────────────────────────────

  parseWorkbookBuffer(buffer: Buffer): ClientPoiItemDto[] {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return [];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
    const out = new Map<string, ClientPoiItemDto>();

    for (const raw of rows) {
      const kCode = findColumnKey(raw, ['Code Client', 'code client', 'Code', 'code']);
      const kNom = findColumnKey(raw, ['Nom Client', 'nom client', 'Nom', 'nom']);
      const kLat = findColumnKey(raw, ['Latitude', 'latitude', 'Lat', 'lat']);
      const kLng = findColumnKey(raw, ['Longitude', 'longitude', 'Lng', 'lon', 'Long']);
      if (!kCode || !kLat || !kLng) continue;

      const codeRaw = String(raw[kCode] ?? '').trim().toUpperCase();
      const nom = kNom ? String(raw[kNom] ?? '').trim() : '';
      const lat = toNum(raw[kLat]);
      const lng = toNum(raw[kLng]);
      if (!codeRaw || lat === null || lng === null) continue;

      out.set(codeRaw, {
        code: codeRaw,
        nom,
        lat,
        lng,
        isDepot: isWarehouseCode(codeRaw),
        source: '',
        groupe: '',
        creePar: '',
      });
    }

    return [...out.values()];
  }

  // ─── EXCEL IMPORT ────────────────────────────────────────────────────────

  /**
   * Remplace tout le référentiel par le contenu du fichier.
   * Les lignes dont le code est un entrepôt → table depots.
   * Les autres → table clients.
   */
  async importExcel(buffer: Buffer): Promise<{ count: number }> {
    if (!buffer?.length) throw new BadRequestException('Fichier vide');

    let items: ClientPoiItemDto[];
    try {
      items = this.parseWorkbookBuffer(buffer);
    } catch {
      throw new BadRequestException('Impossible de lire le fichier Excel');
    }
    if (items.length === 0) {
      throw new BadRequestException(
        'Aucune ligne valide (colonnes attendues : Code client, Latitude, Longitude ; Nom optionnel).',
      );
    }

    const depotItems = items.filter((i) => i.isDepot);
    const clientItems = items.filter((i) => !i.isDepot);

    await this.depotRepo.manager.transaction(async (em) => {
      await em.createQueryBuilder().delete().from(Depot).execute();
      await em.createQueryBuilder().delete().from(ClientPoint).execute();

      if (depotItems.length > 0) {
        const entities = depotItems.map((i) =>
          em.create(Depot, {
            code: i.code,
            name: i.nom || null,
            latitude: i.lat,
            longitude: i.lng,
            source: null,
            groupe: null,
            creePar: null,
          }),
        );
        await em.save(entities);
      }

      if (clientItems.length > 0) {
        const entities = clientItems.map((i) =>
          em.create(ClientPoint, {
            code: i.code,
            name: i.nom || null,
            latitude: i.lat,
            longitude: i.lng,
            source: null,
            groupe: null,
            creePar: null,
          }),
        );
        await em.save(entities);
      }
    });

    return { count: items.length };
  }

  // ─── THEORETICAL KM ──────────────────────────────────────────────────────

  /**
   * Km « théorique » d'un dépôt (originCode) vers chaque code client.
   * Utilise OSRM avec repli haversine. Clés en MAJUSCULES.
   */
  async theoreticalKmBatch(
    originCode: string,
    clientCodes: string[],
  ): Promise<Record<string, number | null>> {
    const n = (s: unknown) => String(s ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const o = n(originCode);
    const uniqueDest = [...new Set(clientCodes.map(n).filter(Boolean))];
    const result: Record<string, number | null> = {};
    if (!o || uniqueDest.length === 0) return result;

    // Origin must be a depot
    const originPoi = await this.depotRepo.findOne({ where: { code: o } });
    if (!originPoi) {
      for (const c of uniqueDest) result[c] = null;
      return result;
    }

    // Destinations are clients
    const destPois =
      uniqueDest.length > 0 ? await this.clientRepo.find({ where: { code: In(uniqueDest) } }) : [];
    const byCode = new Map(destPois.map((p) => [String(p.code).toUpperCase(), p]));

    const lat1 = Number(originPoi.latitude);
    const lon1 = Number(originPoi.longitude);

    for (const c of uniqueDest) {
      const p = byCode.get(c);
      if (!p) { result[c] = null; continue; }
      const lat2 = Number(p.latitude);
      const lon2 = Number(p.longitude);
      let km = await osrmDrivingKm(lat1, lon1, lat2, lon2);
      if (km == null || !Number.isFinite(km)) {
        km = Math.round(haversineKm(lat1, lon1, lat2, lon2) * 100) / 100;
      }
      result[c] = km;
    }
    return result;
  }

  /**
   * Pour chaque ligne : **km total aller-retour** dépôt → client → dépôt.
   */
  async theoreticalKmLegsAlongTour(
    originCode: string,
    orderedClientCodes: string[],
  ): Promise<(number | null)[]> {
    const n = (s: unknown) => String(s ?? '').trim().toUpperCase().replace(/\s+/g, '');
    const o = n(originCode);
    if (!o) return orderedClientCodes.map(() => null);

    const uniqueDest = [...new Set(orderedClientCodes.map(n).filter(Boolean))];

    const [originPoi, destPois] = await Promise.all([
      this.depotRepo.findOne({ where: { code: o } }),
      uniqueDest.length > 0 ? this.clientRepo.find({ where: { code: In(uniqueDest) } }) : [],
    ]);
    if (!originPoi) return orderedClientCodes.map(() => null);

    const byCode = new Map((destPois as ClientPoint[]).map((p) => [String(p.code).toUpperCase(), p]));
    const depLat = Number(originPoi.latitude);
    const depLon = Number(originPoi.longitude);

    const oneWayKm = async (lat1: number, lon1: number, lat2: number, lon2: number) => {
      let km = await osrmDrivingKm(lat1, lon1, lat2, lon2);
      if (km == null || !Number.isFinite(km)) {
        km = Math.round(haversineKm(lat1, lon1, lat2, lon2) * 100) / 100;
      }
      return km;
    };

    const out: (number | null)[] = [];
    for (const raw of orderedClientCodes) {
      const c = n(raw);
      if (!c) { out.push(null); continue; }
      const p = byCode.get(c);
      if (!p) { out.push(null); continue; }
      const lat2 = Number(p.latitude);
      const lon2 = Number(p.longitude);
      const kmAller = await oneWayKm(depLat, depLon, lat2, lon2);
      const kmRetour = await oneWayKm(lat2, lon2, depLat, depLon);
      out.push(Math.round((kmAller + kmRetour) * 100) / 100);
    }
    return out;
  }
}
