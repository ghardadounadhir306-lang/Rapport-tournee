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
var ActivityLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const activity_log_entity_1 = require("./entities/activity-log.entity");
let ActivityLogService = ActivityLogService_1 = class ActivityLogService {
    repo;
    logger = new common_1.Logger(ActivityLogService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async log(input) {
        try {
            const row = this.repo.create({
                action: input.action.slice(0, 64),
                actorEmail: input.actorEmail ? String(input.actorEmail).slice(0, 255) : null,
                actorUserId: input.actorUserId ?? null,
                targetType: input.targetType ? String(input.targetType).slice(0, 64) : null,
                targetId: input.targetId != null ? String(input.targetId).slice(0, 255) : null,
                details: input.details ?? null,
                ip: input.ip ? String(input.ip).slice(0, 64) : null,
            });
            await this.repo.save(row);
        }
        catch (e) {
            this.logger.warn(`activity_logs insert failed: ${String(e?.message ?? e)}`);
        }
    }
    async findRecent(limit = 200, offset = 0) {
        const take = Math.min(Math.max(Number(limit) || 200, 1), 500);
        const skip = Math.max(Number(offset) || 0, 0);
        const [rows, total] = await this.repo.findAndCount({
            order: { createdAt: 'DESC' },
            take,
            skip,
        });
        return {
            total,
            limit: take,
            offset: skip,
            logs: rows.map((r) => ({
                id: r.id,
                created_at: r.createdAt.toISOString(),
                action: r.action,
                actor_email: r.actorEmail,
                actor_user_id: r.actorUserId,
                target_type: r.targetType,
                target_id: r.targetId,
                details: r.details,
                ip: r.ip,
            })),
        };
    }
};
exports.ActivityLogService = ActivityLogService;
exports.ActivityLogService = ActivityLogService = ActivityLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(activity_log_entity_1.ActivityLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ActivityLogService);
//# sourceMappingURL=activity-log.service.js.map