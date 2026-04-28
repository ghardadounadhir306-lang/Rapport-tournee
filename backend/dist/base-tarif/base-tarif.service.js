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
exports.BaseTarifService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const XLSX = __importStar(require("xlsx"));
const typeorm_2 = require("typeorm");
const base_tarif_augmentation_entity_1 = require("./entities/base-tarif-augmentation.entity");
const base_tarif_effective_date_entity_1 = require("./entities/base-tarif-effective-date.entity");
const base_tarif_entity_1 = require("./entities/base-tarif.entity");
function norm(s) {
    return s
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ');
}
function compact(s) {
    return norm(s).replace(/\s/g, '');
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
        const cc = compact(c);
        const hit = keys.find((k) => compact(k) === cc);
        if (hit)
            return hit;
    }
    for (const c of candidates) {
        const nc = norm(c);
        const hit = keys.find((k) => norm(k).includes(nc) || nc.includes(norm(k)));
        if (hit)
            return hit;
    }
    for (const c of candidates) {
        const cc = compact(c);
        const hit = keys.find((k) => compact(k).includes(cc) || cc.includes(compact(k)));
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
const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
let BaseTarifService = class BaseTarifService {
    repo;
    dateRepo;
    augRepo;
    constructor(repo, dateRepo, augRepo) {
        this.repo = repo;
        this.dateRepo = dateRepo;
        this.augRepo = augRepo;
    }
    async getEffectiveDatesList() {
        const set = new Set();
        const fromTable = await this.dateRepo.find({ order: { sortOrder: 'ASC', dateIso: 'ASC' } });
        for (const x of fromTable) {
            if (DATE_ISO_RE.test(x.dateIso))
                set.add(x.dateIso);
        }
        const rows = await this.repo.find();
        for (const r of rows) {
            const t = r.tarifsParDate;
            if (t && typeof t === 'object') {
                for (const k of Object.keys(t)) {
                    if (DATE_ISO_RE.test(k))
                        set.add(k);
                }
            }
        }
        return [...set].sort();
    }
    normalizeDateIso(raw) {
        const t = String(raw ?? '').trim();
        if (!DATE_ISO_RE.test(t))
            return null;
        const d = new Date(`${t}T12:00:00.000Z`);
        if (Number.isNaN(d.getTime()))
            return null;
        return t;
    }
    async addEffectiveDate(dateRaw) {
        const dateIso = this.normalizeDateIso(dateRaw);
        if (!dateIso) {
            throw new common_1.BadRequestException('Date invalide — utiliser le format AAAA-MM-JJ (ex. 2021-06-15)');
        }
        const existing = await this.dateRepo.findOne({ where: { dateIso } });
        if (!existing) {
            const rawMax = await this.dateRepo
                .createQueryBuilder('d')
                .select('COALESCE(MAX(d.sortOrder), -1)', 'm')
                .getRawOne();
            const nextOrder = Number(rawMax?.m ?? -1) + 1;
            await this.dateRepo.save(this.dateRepo.create({ dateIso, sortOrder: nextOrder }));
        }
        return { dates: await this.getEffectiveDatesList() };
    }
    async registerDatesFromTarifKeys(keys) {
        for (const dateIso of keys) {
            if (!DATE_ISO_RE.test(dateIso))
                continue;
            const hit = await this.dateRepo.findOne({ where: { dateIso } });
            if (hit)
                continue;
            const rawMax = await this.dateRepo
                .createQueryBuilder('d')
                .select('COALESCE(MAX(d.sortOrder), -1)', 'm')
                .getRawOne();
            const nextOrder = Number(rawMax?.m ?? -1) + 1;
            await this.dateRepo.save(this.dateRepo.create({ dateIso, sortOrder: nextOrder }));
        }
    }
    toDto(r) {
        const t = r.tarifsParDate && typeof r.tarifsParDate === 'object' ? { ...r.tarifsParDate } : {};
        for (const k of Object.keys(t)) {
            if (typeof t[k] !== 'number' || !Number.isFinite(t[k]))
                delete t[k];
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
    validateRanges(distMin, distMax, capMin, capMax) {
        if (distMin > distMax) {
            throw new common_1.BadRequestException('DIST MIN doit être ≤ DIST MAX');
        }
        if (capMin > capMax) {
            throw new common_1.BadRequestException('CAP MIN doit être ≤ CAP MAX');
        }
    }
    async findAll() {
        const rows = await this.repo.find({ order: { typeCode: 'ASC', distMin: 'ASC', capMin: 'ASC', id: 'ASC' } });
        return { count: rows.length, items: rows.map((r) => this.toDto(r)) };
    }
    async findMatchingTarif(typeCode, distance, capacity) {
        const row = await this.repo
            .createQueryBuilder('t')
            .where('t.typeCode = :typeCode', { typeCode })
            .andWhere('t.distMin <= :distance AND t.distMax >= :distance', { distance })
            .andWhere('t.capMin <= :capacity AND t.capMax >= :capacity', { capacity })
            .orderBy('t.id', 'ASC')
            .getOne();
        if (!row)
            return null;
        const factor = await this.getAugmentationFactor();
        const dto = this.toDto(row);
        if (factor !== 1) {
            if (dto.tarifBase != null)
                dto.tarifBase = Math.round(dto.tarifBase * factor * 100) / 100;
            for (const k of Object.keys(dto.tarifsParDate)) {
                dto.tarifsParDate[k] = Math.round(dto.tarifsParDate[k] * factor * 100) / 100;
            }
        }
        return { ...dto, augmentationPercent: Math.round((factor - 1) * 10000) / 100 };
    }
    async create(body) {
        const typeCode = String(body.typeCode ?? '').trim();
        if (!typeCode)
            throw new common_1.BadRequestException('TYPE CODE obligatoire');
        const distMin = toNum(body.distMin);
        const distMax = toNum(body.distMax);
        const capMin = toNum(body.capMin);
        const capMax = toNum(body.capMax);
        if (distMin === null || distMax === null || capMin === null || capMax === null) {
            throw new common_1.BadRequestException('DIST MIN/MAX et CAP MIN/MAX numériques obligatoires');
        }
        this.validateRanges(distMin, distMax, capMin, capMax);
        const tarifBase = body.tarifBase === undefined || body.tarifBase === null ? null : toNum(body.tarifBase);
        if (body.tarifBase !== undefined && body.tarifBase !== null && tarifBase === null) {
            throw new common_1.BadRequestException('TARIF BASE invalide');
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
    normalizeTarifsJson(raw) {
        const out = {};
        if (!raw || typeof raw !== 'object')
            return out;
        for (const [k, v] of Object.entries(raw)) {
            if (v === null || v === undefined)
                continue;
            const n = toNum(v);
            if (n !== null)
                out[k] = n;
        }
        return out;
    }
    async update(idRaw, body) {
        const id = String(idRaw).trim();
        const row = await this.repo.findOne({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException(`Règle id=${id} introuvable`);
        if (body.typeCode !== undefined)
            row.typeCode = String(body.typeCode).trim() || row.typeCode;
        if (body.distMin !== undefined || body.distMax !== undefined || body.capMin !== undefined || body.capMax !== undefined) {
            const distMin = toNum(body.distMin !== undefined ? body.distMin : row.distMin);
            const distMax = toNum(body.distMax !== undefined ? body.distMax : row.distMax);
            const capMin = toNum(body.capMin !== undefined ? body.capMin : row.capMin);
            const capMax = toNum(body.capMax !== undefined ? body.capMax : row.capMax);
            if ([distMin, distMax, capMin, capMax].some((x) => x === null || !Number.isFinite(x))) {
                throw new common_1.BadRequestException('Plages numériques invalides');
            }
            this.validateRanges(distMin, distMax, capMin, capMax);
            row.distMin = distMin;
            row.distMax = distMax;
            row.capMin = capMin;
            row.capMax = capMax;
        }
        if (body.tarifBase !== undefined) {
            row.tarifBase = body.tarifBase === null ? null : toNum(body.tarifBase);
            if (body.tarifBase !== null && row.tarifBase === null)
                throw new common_1.BadRequestException('TARIF BASE invalide');
        }
        if (body.tarifsParDate !== undefined) {
            row.tarifsParDate = this.normalizeTarifsJson(body.tarifsParDate);
        }
        if (body.creePar !== undefined)
            row.creePar = String(body.creePar ?? '').trim() || null;
        const saved = await this.repo.save(row);
        if (body.tarifsParDate !== undefined) {
            await this.registerDatesFromTarifKeys(Object.keys(saved.tarifsParDate || {}));
        }
        return this.toDto(saved);
    }
    async remove(idRaw) {
        const id = String(idRaw).trim();
        const res = await this.repo.delete({ id });
        if (!res.affected)
            throw new common_1.NotFoundException(`Règle id=${id} introuvable`);
        return { ok: true };
    }
    async createAugmentation(body) {
        const percent = Number(body.percent);
        if (!Number.isFinite(percent) || percent === 0) {
            throw new common_1.BadRequestException('Pourcentage invalide (doit être un nombre ≠ 0)');
        }
        const dateEffet = this.normalizeDateIso(body.dateEffet);
        if (!dateEffet)
            throw new common_1.BadRequestException("Date d'effet invalide (AAAA-MM-JJ)");
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
    async deleteAugmentation(id) {
        const res = await this.augRepo.delete({ id });
        if (!res.affected)
            throw new common_1.NotFoundException(`Augmentation id=${id} introuvable`);
        return { ok: true };
    }
    async getAugmentationFactor(dateIso) {
        const today = dateIso || new Date().toISOString().slice(0, 10);
        const rows = await this.augRepo.find({
            where: { dateEffet: (0, typeorm_2.LessThanOrEqual)(today) },
            order: { dateEffet: 'ASC', id: 'ASC' },
        });
        let factor = 1;
        for (const a of rows) {
            factor *= 1 + a.percent / 100;
        }
        return factor;
    }
    toAugDto(r) {
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
    parseWorkbookBuffer(buffer) {
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = wb.SheetNames[0];
        if (!sheetName)
            return [];
        const sheet = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        const out = [];
        for (const raw of rows) {
            const kType = findColumnKey(raw, ['TYPE CODE', 'Type', 'type code', 'Type code', 'type', 'TypeCode']);
            const kDistMin = findColumnKey(raw, ['DIST MIN', 'DistMin', 'dist min', 'Dist min', 'dist_min']);
            const kDistMax = findColumnKey(raw, ['DIST MAX', 'DistMax', 'dist max', 'Dist max', 'dist_max']);
            const kCapMin = findColumnKey(raw, ['CAP MIN', 'CapMin', 'cap min', 'Cap min', 'cap_min']);
            const kCapMax = findColumnKey(raw, ['CAP MAX', 'CapMax', 'cap max', 'Cap max', 'cap_max']);
            const kTarifBase = findColumnKey(raw, ['TARIF BASE', 'Tarifs', 'Tarif', 'tarif base', 'Tarif base', 'TarifBase', 'tarif', 'tarifs', 'Montant', 'Prix']);
            const kCree = findColumnKey(raw, ['CRÉE PAR', 'CREE PAR', 'cree par', 'Créé par', 'CreePar']);
            if (!kType || !kDistMin || !kDistMax || !kCapMin || !kCapMax)
                continue;
            const typeCode = String(raw[kType] ?? '').trim();
            const distMin = toNum(raw[kDistMin]);
            const distMax = toNum(raw[kDistMax]);
            const capMin = toNum(raw[kCapMin]);
            const capMax = toNum(raw[kCapMax]);
            if (!typeCode || distMin === null || distMax === null || capMin === null || capMax === null)
                continue;
            const tarifBase = kTarifBase ? toNum(raw[kTarifBase]) : null;
            const tarifsParDate = {};
            for (const key of Object.keys(raw)) {
                const kn = key.trim();
                if (DATE_ISO_RE.test(kn)) {
                    const v = toNum(raw[key]);
                    if (v !== null)
                        tarifsParDate[kn] = v;
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
            throw new common_1.BadRequestException('Aucune ligne valide (colonnes : TYPE CODE, DIST MIN, DIST MAX, CAP MIN, CAP MAX).');
        }
        const allDateKeys = new Set();
        await this.repo.manager.transaction(async (em) => {
            for (const i of items) {
                this.validateRanges(i.distMin, i.distMax, i.capMin, i.capMax);
                for (const k of Object.keys(i.tarifsParDate || {})) {
                    if (DATE_ISO_RE.test(k))
                        allDateKeys.add(k);
                }
                await em.save(em.create(base_tarif_entity_1.BaseTarif, {
                    typeCode: i.typeCode,
                    distMin: i.distMin,
                    distMax: i.distMax,
                    capMin: i.capMin,
                    capMax: i.capMax,
                    tarifBase: i.tarifBase,
                    tarifsParDate: i.tarifsParDate,
                    creePar: i.creePar || null,
                }));
            }
        });
        await this.registerDatesFromTarifKeys([...allDateKeys]);
        return { count: items.length };
    }
};
exports.BaseTarifService = BaseTarifService;
exports.BaseTarifService = BaseTarifService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(base_tarif_entity_1.BaseTarif)),
    __param(1, (0, typeorm_1.InjectRepository)(base_tarif_effective_date_entity_1.BaseTarifEffectiveDate)),
    __param(2, (0, typeorm_1.InjectRepository)(base_tarif_augmentation_entity_1.BaseTarifAugmentation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BaseTarifService);
//# sourceMappingURL=base-tarif.service.js.map