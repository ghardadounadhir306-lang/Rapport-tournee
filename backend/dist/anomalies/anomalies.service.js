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
exports.AnomaliesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const anomaly_entity_1 = require("./entities/anomaly.entity");
let AnomaliesService = class AnomaliesService {
    anomalyRepo;
    constructor(anomalyRepo) {
        this.anomalyRepo = anomalyRepo;
    }
    async list(filters) {
        const take = Math.min(Math.max(Number(filters.limit) || 200, 1), 500);
        const skip = Math.max(Number(filters.offset) || 0, 0);
        const qb = this.anomalyRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.anomalyType', 't')
            .orderBy('a.created_at', 'DESC')
            .take(take)
            .skip(skip);
        if (filters.tourneeId?.trim()) {
            qb.andWhere('a.tournee_id = :tid', { tid: filters.tourneeId.trim() });
        }
        const [rows, total] = await qb.getManyAndCount();
        return {
            total,
            limit: take,
            offset: skip,
            anomalies: rows.map((a) => ({
                id: a.id,
                tournee_id: a.tourneeId,
                prestation_id: a.prestationId,
                camion_id: a.camionId,
                anomaly_type_id: a.anomalyTypeId,
                type_code: a.anomalyType?.code ?? null,
                type_label: a.anomalyType?.label ?? null,
                description: a.description,
                created_at: a.createdAt.toISOString(),
            })),
        };
    }
};
exports.AnomaliesService = AnomaliesService;
exports.AnomaliesService = AnomaliesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(anomaly_entity_1.Anomaly)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AnomaliesService);
//# sourceMappingURL=anomalies.service.js.map