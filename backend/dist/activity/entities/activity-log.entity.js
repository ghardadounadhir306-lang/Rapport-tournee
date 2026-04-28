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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
const typeorm_1 = require("typeorm");
let ActivityLog = class ActivityLog {
    id;
    createdAt;
    action;
    actorEmail;
    actorUserId;
    targetType;
    targetId;
    details;
    ip;
};
exports.ActivityLog = ActivityLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ActivityLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], ActivityLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], ActivityLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_email', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "actorEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_user_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "actorUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_type', type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "targetType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "targetId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], ActivityLog.prototype, "ip", void 0);
exports.ActivityLog = ActivityLog = __decorate([
    (0, typeorm_1.Entity)({ name: 'activity_logs' })
], ActivityLog);
//# sourceMappingURL=activity-log.entity.js.map