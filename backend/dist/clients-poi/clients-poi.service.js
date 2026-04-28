"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsPoiService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const XLSX = __importStar(require("xlsx"));
const typeorm_2 = require("typeorm");
const depot_entity_1 = require("./entities/depot.entity");
const client_point_entity_1 = require("./entities/client-point.entity");
const warehouse_codes_1 = require("./warehouse-codes");
const geo_1 = require("./geo");
const osrm_route_1 = require("./osrm-route");
function norm(s) {
    return s
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}
function findColumnKey(row, candidates) {
    const keys = Object.keys(row);
    for (const c of candidates) {
        const nc = norm(c);
        const hit = keys.find((k) => norm(k) === nc);
        if (hit)
            return hit;
    }
    for (const c of candidates) {
        const nc = norm(c);
        const hit = keys.find((k) => norm(k).includes(nc) || nc.includes(norm(k)));
        if (hit)
            return hit;
    }
    return null;
}
function toNum(v) {
    if (v === null || v === undefined || v === '')
        return null;
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    const s = String(v).trim().replace(',', '.');
    const n = Number.parseFloat(s);
    return Number.isFinite(n) ? n : null;
}
function normCode(s) {
    return String(s ?? '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
}
function depotToDto(r) {
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
function clientToDto(r) {
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
let ClientsPoiService = class ClientsPoiService {
    depotRepo;
    clientRepo;
    constructor(depotRepo, clientRepo) {
        this.depotRepo = depotRepo;
        this.clientRepo = clientRepo;
    }
    async findAll() {
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
    async findAllDepots() {
        const rows = await this.depotRepo.find({ order: { code: 'ASC' } });
        return { count: rows.length, items: rows.map(depotToDto) };
    }
    async findAllClients() {
        const rows = await this.clientRepo.find({ order: { code: 'ASC' } });
        return { count: rows.length, items: rows.map(clientToDto) };
    }
    async create(body) {
        const code = normCode(body.code);
        if (!code)
            throw new common_1.BadRequestException('Code client obligatoire');
        const lat = toNum(body.latitude);
        const lng = toNum(body.longitude);
        if (lat === null || lng === null)
            throw new common_1.BadRequestException('Latitude et longitude valides obligatoires');
        const nom = String(body.nom ?? '').trim();
        const isDepot = body.isDepot === true || (0, warehouse_codes_1.isWarehouseCode)(code);
        if (isDepot) {
            const exists = await this.depotRepo.findOne({ where: { code } });
            if (exists)
                throw new common_1.BadRequestException(`Le dépôt « ${code} » existe déjà`);
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
        }
        else {
            const exists = await this.clientRepo.findOne({ where: { code } });
            if (exists)
                throw new common_1.BadRequestException(`Le client « ${code} » existe déjà`);
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
    async update(codeRaw, body) {
        const code = normCode(codeRaw);
        if (!code)
            throw new common_1.BadRequestException('Code manquant');
        const depotRow = await this.depotRepo.findOne({ where: { code } });
        if (depotRow) {
            if (body.nom !== undefined)
                depotRow.name = String(body.nom ?? '').trim() || null;
            if (body.latitude !== undefined || body.longitude !== undefined) {
                const lat = body.latitude !== undefined ? toNum(body.latitude) : toNum(depotRow.latitude);
                const lng = body.longitude !== undefined ? toNum(body.longitude) : toNum(depotRow.longitude);
                if (lat === null || lng === null)
                    throw new common_1.BadRequestException('Latitude et longitude valides obligatoires');
                depotRow.latitude = lat;
                depotRow.longitude = lng;
            }
            if (body.source !== undefined)
                depotRow.source = String(body.source ?? '').trim() || null;
            if (body.groupe !== undefined)
                depotRow.groupe = String(body.groupe ?? '').trim() || null;
            if (body.creePar !== undefined)
                depotRow.creePar = String(body.creePar ?? '').trim() || null;
            return depotToDto(await this.depotRepo.save(depotRow));
        }
        const clientRow = await this.clientRepo.findOne({ where: { code } });
        if (clientRow) {
            if (body.nom !== undefined)
                clientRow.name = String(body.nom ?? '').trim() || null;
            if (body.latitude !== undefined || body.longitude !== undefined) {
                const lat = body.latitude !== undefined ? toNum(body.latitude) : toNum(clientRow.latitude);
                const lng = body.longitude !== undefined ? toNum(body.longitude) : toNum(clientRow.longitude);
                if (lat === null || lng === null)
                    throw new common_1.BadRequestException('Latitude et longitude valides obligatoires');
                clientRow.latitude = lat;
                clientRow.longitude = lng;
            }
            if (body.source !== undefined)
                clientRow.source = String(body.source ?? '').trim() || null;
            if (body.groupe !== undefined)
                clientRow.groupe = String(body.groupe ?? '').trim() || null;
            if (body.creePar !== undefined)
                clientRow.creePar = String(body.creePar ?? '').trim() || null;
            return clientToDto(await this.clientRepo.save(clientRow));
        }
        throw new common_1.NotFoundException(`POI « ${code} » introuvable`);
    }
    async remove(codeRaw) {
        const code = normCode(codeRaw);
        if (!code)
            throw new common_1.BadRequestException('Code manquant');
        const resDepot = await this.depotRepo.delete({ code });
        if (resDepot.affected)
            return { ok: true };
        const resClient = await this.clientRepo.delete({ code });
        if (resClient.affected)
            return { ok: true };
        throw new common_1.NotFoundException(`POI « ${code} » introuvable`);
    }
    parseWorkbookBuffer(buffer) {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = wb.SheetNames[0];
        if (!sheetName)
            return [];
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        const out = new Map();
        for (const raw of rows) {
            const kCode = findColumnKey(raw, ['Code Client', 'code client', 'Code', 'code']);
            const kNom = findColumnKey(raw, ['Nom Client', 'nom client', 'Nom', 'nom']);
            const kLat = findColumnKey(raw, ['Latitude', 'latitude', 'Lat', 'lat']);
            const kLng = findColumnKey(raw, ['Longitude', 'longitude', 'Lng', 'lon', 'Long']);
            if (!kCode || !kLat || !kLng)
                continue;
            const codeRaw = String(raw[kCode] ?? '').trim().toUpperCase();
            const nom = kNom ? String(raw[kNom] ?? '').trim() : '';
            const lat = toNum(raw[kLat]);
            const lng = toNum(raw[kLng]);
            if (!codeRaw || lat === null || lng === null)
                continue;
            out.set(codeRaw, {
                code: codeRaw,
                nom,
                lat,
                lng,
                isDepot: (0, warehouse_codes_1.isWarehouseCode)(codeRaw),
                source: '',
                groupe: '',
                creePar: '',
            });
        }
        return [...out.values()];
    }
    async importExcel(buffer) {
        if (!buffer?.length)
            throw new common_1.BadRequestException('Fichier vide');
        let items;
        try {
            items = this.parseWorkbookBuffer(buffer);
        }
        catch {
            throw new common_1.BadRequestException('Impossible de lire le fichier Excel');
        }
        if (items.length === 0) {
            throw new common_1.BadRequestException('Aucune ligne valide (colonnes attendues : Code client, Latitude, Longitude ; Nom optionnel).');
        }
        const depotItems = items.filter((i) => i.isDepot);
        const clientItems = items.filter((i) => !i.isDepot);
        await this.depotRepo.manager.transaction(async (em) => {
            await em.createQueryBuilder().delete().from(depot_entity_1.Depot).execute();
            await em.createQueryBuilder().delete().from(client_point_entity_1.ClientPoint).execute();
            if (depotItems.length > 0) {
                const entities = depotItems.map((i) => em.create(depot_entity_1.Depot, {
                    code: i.code,
                    name: i.nom || null,
                    latitude: i.lat,
                    longitude: i.lng,
                    source: null,
                    groupe: null,
                    creePar: null,
                }));
                await em.save(entities);
            }
            if (clientItems.length > 0) {
                const entities = clientItems.map((i) => em.create(client_point_entity_1.ClientPoint, {
                    code: i.code,
                    name: i.nom || null,
                    latitude: i.lat,
                    longitude: i.lng,
                    source: null,
                    groupe: null,
                    creePar: null,
                }));
                await em.save(entities);
            }
        });
        return { count: items.length };
    }
    async theoreticalKmBatch(originCode, clientCodes) {
        const n = (s) => String(s ?? '').trim().toUpperCase().replace(/\s+/g, '');
        const o = n(originCode);
        const uniqueDest = [...new Set(clientCodes.map(n).filter(Boolean))];
        const result = {};
        if (!o || uniqueDest.length === 0)
            return result;
        const originPoi = await this.depotRepo.findOne({ where: { code: o } });
        if (!originPoi) {
            for (const c of uniqueDest)
                result[c] = null;
            return result;
        }
        const destPois = uniqueDest.length > 0 ? await this.clientRepo.find({ where: { code: (0, typeorm_2.In)(uniqueDest) } }) : [];
        const byCode = new Map(destPois.map((p) => [String(p.code).toUpperCase(), p]));
        const lat1 = Number(originPoi.latitude);
        const lon1 = Number(originPoi.longitude);
        for (const c of uniqueDest) {
            const p = byCode.get(c);
            if (!p) {
                result[c] = null;
                continue;
            }
            const lat2 = Number(p.latitude);
            const lon2 = Number(p.longitude);
            let km = await (0, osrm_route_1.osrmDrivingKm)(lat1, lon1, lat2, lon2);
            if (km == null || !Number.isFinite(km)) {
                km = Math.round((0, geo_1.haversineKm)(lat1, lon1, lat2, lon2) * 100) / 100;
            }
            result[c] = km;
        }
        return result;
    }
    async theoreticalKmLegsAlongTour(originCode, orderedClientCodes) {
        const n = (s) => String(s ?? '').trim().toUpperCase().replace(/\s+/g, '');
        const o = n(originCode);
        if (!o)
            return orderedClientCodes.map(() => null);
        const uniqueDest = [...new Set(orderedClientCodes.map(n).filter(Boolean))];
        const [originPoi, destPois] = await Promise.all([
            this.depotRepo.findOne({ where: { code: o } }),
            uniqueDest.length > 0 ? this.clientRepo.find({ where: { code: (0, typeorm_2.In)(uniqueDest) } }) : [],
        ]);
        if (!originPoi)
            return orderedClientCodes.map(() => null);
        const byCode = new Map(destPois.map((p) => [String(p.code).toUpperCase(), p]));
        const depLat = Number(originPoi.latitude);
        const depLon = Number(originPoi.longitude);
        const oneWayKm = async (lat1, lon1, lat2, lon2) => {
            let km = await (0, osrm_route_1.osrmDrivingKm)(lat1, lon1, lat2, lon2);
            if (km == null || !Number.isFinite(km)) {
                km = Math.round((0, geo_1.haversineKm)(lat1, lon1, lat2, lon2) * 100) / 100;
            }
            return km;
        };
        const out = [];
        for (const raw of orderedClientCodes) {
            const c = n(raw);
            if (!c) {
                out.push(null);
                continue;
            }
            const p = byCode.get(c);
            if (!p) {
                out.push(null);
                continue;
            }
            const lat2 = Number(p.latitude);
            const lon2 = Number(p.longitude);
            const kmAller = await oneWayKm(depLat, depLon, lat2, lon2);
            const kmRetour = await oneWayKm(lat2, lon2, depLat, depLon);
            out.push(Math.round((kmAller + kmRetour) * 100) / 100);
        }
        return out;
    }
};
exports.ClientsPoiService = ClientsPoiService;
exports.ClientsPoiService = ClientsPoiService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(depot_entity_1.Depot)),
    __param(1, (0, typeorm_1.InjectRepository)(client_point_entity_1.ClientPoint)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ClientsPoiService);
//# sourceMappingURL=clients-poi.service.js.map