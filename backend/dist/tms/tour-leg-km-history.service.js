"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TourLegKmHistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tour_leg_km_sample_entity_1 = require("./entities/tour-leg-km-sample.entity");
const site_code_lookup_1 = require("./site-code-lookup");
let TourLegKmHistoryService = class TourLegKmHistoryService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    normalizeSite(raw) {
        const s = (0, site_code_lookup_1.resolveSiteCodeForDisplay)(raw?.trim() ? String(raw).trim() : null) ?? (raw ? String(raw).trim() : '');
        const u = s.trim().toUpperCase();
        return u || null;
    }
    normalizeClient(raw) {
        if (raw == null)
            return null;
        const u = String(raw).trim().toUpperCase();
        return u || null;
    }
    parseKmTh(raw) {
        if (raw == null || raw === '')
            return null;
        const n = Number(String(raw).replace(',', '.').trim());
        return Number.isFinite(n) ? n : null;
    }
    async getAverage(sitcodeRaw, clientCode) {
        const sc = this.normalizeSite(sitcodeRaw ?? null);
        const cc = this.normalizeClient(clientCode ?? '');
        if (!sc || !cc)
            return null;
        try {
            const row = await this.repo
                .createQueryBuilder('s')
                .select('AVG(s.distanceKm)', 'avg')
                .addSelect('COUNT(*)', 'cnt')
                .where('s.sitcode = :sc', { sc })
                .andWhere('s.clientCode = :cc', { cc })
                .getRawOne();
            if (!row?.cnt || row.cnt === '0' || row.avg == null)
                return null;
            const v = Number(row.avg);
            return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
        }
        catch {
            return null;
        }
    }
    async recordSamples(tmsFormId, sitcodeRaw, rows) {
        const base = this.normalizeSite(sitcodeRaw ?? null);
        if (!base || !Array.isArray(rows))
            return;
        for (const row of rows) {
            const cc = this.normalizeClient(row?.client);
            if (!cc)
                continue;
            const km = this.parseKmTh(row?.kmTh);
            if (km == null)
                continue;
            try {
                let sample = await this.repo.findOne({
                    where: { sitcode: base, clientCode: cc, tmsFormId },
                });
                if (sample) {
                    sample.distanceKm = km;
                    await this.repo.save(sample);
                }
                else {
                    sample = this.repo.create({
                        sitcode: base,
                        clientCode: cc,
                        tmsFormId,
                        distanceKm: km,
                    });
                    await this.repo.save(sample);
                }
            }
            catch {
            }
        }
    }
};
exports.TourLegKmHistoryService = TourLegKmHistoryService;
exports.TourLegKmHistoryService = TourLegKmHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tour_leg_km_sample_entity_1.TourLegKmSample)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TourLegKmHistoryService);
//# sourceMappingURL=tour-leg-km-history.service.js.map