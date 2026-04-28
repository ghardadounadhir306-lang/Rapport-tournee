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
exports.Anomaly = void 0;
const typeorm_1 = require("typeorm");
const anomaly_type_entity_1 = require("./anomaly-type.entity");
let Anomaly = class Anomaly {
    id;
    tourneeId;
    prestationId;
    camionId;
    anomalyType;
    anomalyTypeId;
    description;
    createdAt;
};
exports.Anomaly = Anomaly;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Anomaly.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tournee_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Anomaly.prototype, "tourneeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prestation_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Anomaly.prototype, "prestationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'camion_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Anomaly.prototype, "camionId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => anomaly_type_entity_1.AnomalyType, (t) => t.anomalies, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'anomaly_type_id' }),
    __metadata("design:type", anomaly_type_entity_1.AnomalyType)
], Anomaly.prototype, "anomalyType", void 0);
__decorate([
    (0, typeorm_1.RelationId)((a) => a.anomalyType),
    __metadata("design:type", Number)
], Anomaly.prototype, "anomalyTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Anomaly.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Anomaly.prototype, "createdAt", void 0);
exports.Anomaly = Anomaly = __decorate([
    (0, typeorm_1.Entity)({ name: 'anomalies', synchronize: false })
], Anomaly);
//# sourceMappingURL=anomaly.entity.js.map