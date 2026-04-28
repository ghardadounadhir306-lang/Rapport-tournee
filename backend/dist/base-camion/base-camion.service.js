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
exports.BaseCamionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const XLSX = __importStar(require("xlsx"));
const typeorm_2 = require("typeorm");
const base_camion_entity_1 = require("./entities/base-camion.entity");
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
function normCamion(s) {
    return String(s ?? '')
        .trim()
        .replace(/\s+/g, ' ');
}
let BaseCamionService = class BaseCamionService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    toDto(r) {
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
    async findAll() {
        const rows = await this.repo.find({ order: { camion: 'ASC' } });
        return { count: rows.length, items: rows.map((r) => this.toDto(r)) };
    }
    async create(body) {
        const camion = normCamion(body.camion);
        if (!camion) {
            throw new common_1.BadRequestException('Immatriculation (camion) obligatoire');
        }
        const exists = await this.repo.findOne({ where: { camion } });
        if (exists) {
            throw new common_1.BadRequestException(`Le camion « ${camion} » existe déjà`);
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
    async update(idRaw, body) {
        const id = String(idRaw).trim();
        const row = await this.repo.findOne({ where: { id } });
        if (!row) {
            throw new common_1.NotFoundException(`Camion id=${id} introuvable`);
        }
        if (body.camion !== undefined) {
            const camion = normCamion(body.camion);
            if (!camion) {
                throw new common_1.BadRequestException('Immatriculation (camion) obligatoire');
            }
            if (camion !== row.camion) {
                const clash = await this.repo.findOne({ where: { camion } });
                if (clash && String(clash.id) !== id) {
                    throw new common_1.BadRequestException(`Le camion « ${camion} » existe déjà`);
                }
            }
            row.camion = camion;
        }
        if (body.marque !== undefined)
            row.marque = String(body.marque ?? '').trim() || null;
        if (body.site !== undefined)
            row.site = String(body.site ?? '').trim() || null;
        if (body.type !== undefined)
            row.typeCamion = String(body.type ?? '').trim() || null;
        if (body.affectation !== undefined)
            row.affectation = String(body.affectation ?? '').trim() || null;
        if (body.capacite !== undefined)
            row.capacite = String(body.capacite ?? '').trim() || null;
        if (body.utile !== undefined)
            row.utile = String(body.utile ?? '').trim() || null;
        const saved = await this.repo.save(row);
        return this.toDto(saved);
    }
    async remove(idRaw) {
        const id = String(idRaw).trim();
        const res = await this.repo.delete({ id });
        if (!res.affected) {
            throw new common_1.NotFoundException(`Camion id=${id} introuvable`);
        }
        return { ok: true };
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
            const kCamion = findColumnKey(raw, ['CAMION', 'Camion', 'camion', 'immat', 'plaque']);
            if (!kCamion)
                continue;
            const camion = normCamion(raw[kCamion]);
            if (!camion || camion === '—')
                continue;
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
    async importExcel(buffer) {
        if (!buffer?.length) {
            throw new common_1.BadRequestException('Fichier vide');
        }
        let items;
        try {
            items = this.parseWorkbookBuffer(buffer);
        }
        catch {
            throw new common_1.BadRequestException('Impossible de lire le fichier Excel');
        }
        if (items.length === 0) {
            throw new common_1.BadRequestException('Aucune ligne valide (colonne CAMION obligatoire ; MARQUE, SITE, TYPE, etc. optionnels).');
        }
        await this.repo.manager.transaction(async (em) => {
            for (const i of items) {
                const existing = await em.findOne(base_camion_entity_1.BaseCamion, { where: { camion: i.camion } });
                if (existing) {
                    existing.marque = i.marque || null;
                    existing.site = i.site || null;
                    existing.typeCamion = i.type || null;
                    existing.affectation = i.affectation || null;
                    existing.capacite = i.capacite || null;
                    existing.utile = i.utile || null;
                    await em.save(existing);
                }
                else {
                    await em.save(em.create(base_camion_entity_1.BaseCamion, {
                        camion: i.camion,
                        marque: i.marque || null,
                        site: i.site || null,
                        typeCamion: i.type || null,
                        affectation: i.affectation || null,
                        capacite: i.capacite || null,
                        utile: i.utile || null,
                    }));
                }
            }
        });
        return { count: items.length };
    }
};
exports.BaseCamionService = BaseCamionService;
exports.BaseCamionService = BaseCamionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(base_camion_entity_1.BaseCamion)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BaseCamionService);
//# sourceMappingURL=base-camion.service.js.map