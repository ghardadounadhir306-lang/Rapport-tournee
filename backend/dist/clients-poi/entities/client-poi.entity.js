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
exports.ClientPoi = void 0;
const typeorm_1 = require("typeorm");
let ClientPoi = class ClientPoi {
    id;
    clientCode;
    name;
    latitude;
    longitude;
    isDepot;
    source;
    groupe;
    creePar;
    createdAt;
    updatedAt;
};
exports.ClientPoi = ClientPoi;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], ClientPoi.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_code', type: 'varchar', length: 64, unique: true }),
    __metadata("design:type", String)
], ClientPoi.prototype, "clientCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512, nullable: true }),
    __metadata("design:type", Object)
], ClientPoi.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ClientPoi.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ClientPoi.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ClientPoi.prototype, "isDepot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ClientPoi.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'groupe', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ClientPoi.prototype, "groupe", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cree_par', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ClientPoi.prototype, "creePar", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], ClientPoi.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], ClientPoi.prototype, "updatedAt", void 0);
exports.ClientPoi = ClientPoi = __decorate([
    (0, typeorm_1.Entity)({ name: 'client_pois' }),
    (0, typeorm_1.Index)('ix_client_pois_depot', ['isDepot'])
], ClientPoi);
//# sourceMappingURL=client-poi.entity.js.map