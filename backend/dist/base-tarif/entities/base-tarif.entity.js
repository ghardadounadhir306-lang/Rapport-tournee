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
exports.BaseTarif = void 0;
const typeorm_1 = require("typeorm");
let BaseTarif = class BaseTarif {
    id;
    typeCode;
    distMin;
    distMax;
    capMin;
    capMax;
    tarifBase;
    tarifsParDate;
    creePar;
    createdAt;
    updatedAt;
};
exports.BaseTarif = BaseTarif;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], BaseTarif.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'type_code', type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], BaseTarif.prototype, "typeCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dist_min', type: 'double precision' }),
    __metadata("design:type", Number)
], BaseTarif.prototype, "distMin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dist_max', type: 'double precision' }),
    __metadata("design:type", Number)
], BaseTarif.prototype, "distMax", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cap_min', type: 'double precision' }),
    __metadata("design:type", Number)
], BaseTarif.prototype, "capMin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cap_max', type: 'double precision' }),
    __metadata("design:type", Number)
], BaseTarif.prototype, "capMax", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tarif_base', type: 'double precision', nullable: true }),
    __metadata("design:type", Object)
], BaseTarif.prototype, "tarifBase", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tarifs_par_date', type: 'jsonb', default: () => "'{}'" }),
    __metadata("design:type", Object)
], BaseTarif.prototype, "tarifsParDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cree_par', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], BaseTarif.prototype, "creePar", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], BaseTarif.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], BaseTarif.prototype, "updatedAt", void 0);
exports.BaseTarif = BaseTarif = __decorate([
    (0, typeorm_1.Entity)({ name: 'base_tarif' }),
    (0, typeorm_1.Index)('ix_base_tarif_type_code', ['typeCode'])
], BaseTarif);
//# sourceMappingURL=base-tarif.entity.js.map