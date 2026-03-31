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
exports.GpsPoint = void 0;
const typeorm_1 = require("typeorm");
let GpsPoint = class GpsPoint {
    id;
    tournee_id;
    tms_form_id;
    latitude;
    longitude;
    altitude_m;
    speed_mps;
    accuracy_m;
    recorded_at;
};
exports.GpsPoint = GpsPoint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], GpsPoint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], GpsPoint.prototype, "tournee_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], GpsPoint.prototype, "tms_form_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", String)
], GpsPoint.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 7 }),
    __metadata("design:type", String)
], GpsPoint.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Object)
], GpsPoint.prototype, "altitude_m", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Object)
], GpsPoint.prototype, "speed_mps", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float', nullable: true }),
    __metadata("design:type", Object)
], GpsPoint.prototype, "accuracy_m", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], GpsPoint.prototype, "recorded_at", void 0);
exports.GpsPoint = GpsPoint = __decorate([
    (0, typeorm_1.Entity)({ name: 'gps_points' }),
    (0, typeorm_1.Index)('ix_gps_tms_form_time', ['tms_form_id', 'recorded_at'])
], GpsPoint);
//# sourceMappingURL=gps-point.entity.js.map