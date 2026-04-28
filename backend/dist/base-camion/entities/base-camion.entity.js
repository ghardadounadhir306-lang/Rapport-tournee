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
exports.BaseCamion = void 0;
const typeorm_1 = require("typeorm");
const transport_data_entity_1 = require("../../transport-data/entities/transport-data.entity");
let BaseCamion = class BaseCamion {
    id;
    camion;
    marque;
    site;
    typeCamion;
    affectation;
    capacite;
    utile;
    createdAt;
    updatedAt;
    transportData;
};
exports.BaseCamion = BaseCamion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], BaseCamion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, unique: true }),
    __metadata("design:type", String)
], BaseCamion.prototype, "camion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], BaseCamion.prototype, "marque", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], BaseCamion.prototype, "site", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'type', type: 'varchar', length: 128, nullable: true }),
    __metadata("design:type", Object)
], BaseCamion.prototype, "typeCamion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], BaseCamion.prototype, "affectation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], BaseCamion.prototype, "capacite", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], BaseCamion.prototype, "utile", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], BaseCamion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], BaseCamion.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => transport_data_entity_1.TransportData, (transport) => transport.camion),
    __metadata("design:type", Array)
], BaseCamion.prototype, "transportData", void 0);
exports.BaseCamion = BaseCamion = __decorate([
    (0, typeorm_1.Entity)({ name: 'base_camion' }),
    (0, typeorm_1.Index)('ix_base_camion_site', ['site']),
    (0, typeorm_1.Index)('ix_base_camion_type', ['typeCamion'])
], BaseCamion);
//# sourceMappingURL=base-camion.entity.js.map