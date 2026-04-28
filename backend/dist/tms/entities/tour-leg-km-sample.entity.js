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
exports.TourLegKmSample = void 0;
const typeorm_1 = require("typeorm");
let TourLegKmSample = class TourLegKmSample {
    id;
    sitcode;
    clientCode;
    tmsFormId;
    distanceKm;
    createdAt;
    updatedAt;
};
exports.TourLegKmSample = TourLegKmSample;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], TourLegKmSample.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], TourLegKmSample.prototype, "sitcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_code', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], TourLegKmSample.prototype, "clientCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tms_form_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], TourLegKmSample.prototype, "tmsFormId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'distance_km', type: 'double precision' }),
    __metadata("design:type", Number)
], TourLegKmSample.prototype, "distanceKm", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], TourLegKmSample.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], TourLegKmSample.prototype, "updatedAt", void 0);
exports.TourLegKmSample = TourLegKmSample = __decorate([
    (0, typeorm_1.Entity)({ name: 'tour_leg_km_samples' }),
    (0, typeorm_1.Unique)('uq_tour_leg_km_sample_trip', ['sitcode', 'clientCode', 'tmsFormId']),
    (0, typeorm_1.Index)('ix_tour_leg_km_pair', ['sitcode', 'clientCode'])
], TourLegKmSample);
//# sourceMappingURL=tour-leg-km-sample.entity.js.map