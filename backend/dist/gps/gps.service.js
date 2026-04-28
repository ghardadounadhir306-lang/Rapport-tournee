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
exports.GpsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gps_point_entity_1 = require("./entities/gps-point.entity");
const MIN_POINTS_REAL_ROUTE = Number(process.env.GPS_MIN_POINTS_REAL_ROUTE ?? '3');
let GpsService = class GpsService {
    gpsRepo;
    constructor(gpsRepo) {
        this.gpsRepo = gpsRepo;
    }
    async savePoint(dto) {
        const lat = Number(dto.latitude);
        const lng = Number(dto.longitude);
        if (!dto.tmsFormId?.trim())
            throw new common_1.BadRequestException('tmsFormId requis');
        if (!Number.isFinite(lat) || !Number.isFinite(lng))
            throw new common_1.BadRequestException('latitude/longitude invalides');
        const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();
        if (Number.isNaN(recordedAt.getTime()))
            throw new common_1.BadRequestException('recordedAt invalide');
        const row = this.gpsRepo.create({
            tournee_id: null,
            tms_form_id: dto.tmsFormId.trim(),
            latitude: lat.toFixed(7),
            longitude: lng.toFixed(7),
            altitude_m: dto.altitudeM ?? null,
            speed_mps: dto.speedMps ?? null,
            accuracy_m: dto.accuracyM ?? null,
            recorded_at: recordedAt,
        });
        return this.gpsRepo.save(row);
    }
    async saveBatch(tmsFormId, points) {
        if (!tmsFormId?.trim())
            throw new common_1.BadRequestException('tmsFormId requis');
        if (!Array.isArray(points) || points.length === 0)
            throw new common_1.BadRequestException('points requis');
        const out = [];
        for (const p of points) {
            const saved = await this.savePoint({ ...p, tmsFormId });
            out.push(saved);
        }
        return { inserted: out.length };
    }
    async getPointsByTmsFormId(tmsFormId) {
        const id = decodeURIComponent(tmsFormId);
        return this.gpsRepo.find({
            where: { tms_form_id: id },
            order: { recorded_at: 'ASC' },
        });
    }
    async hasRealRoute(tmsFormId) {
        const id = tmsFormId.trim();
        if (!id)
            return false;
        const n = await this.gpsRepo.count({ where: { tms_form_id: id } });
        return n >= MIN_POINTS_REAL_ROUTE;
    }
};
exports.GpsService = GpsService;
exports.GpsService = GpsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gps_point_entity_1.GpsPoint)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GpsService);
//# sourceMappingURL=gps.service.js.map