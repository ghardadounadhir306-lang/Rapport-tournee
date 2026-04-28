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
exports.ClientPoint = void 0;
const typeorm_1 = require("typeorm");
let ClientPoint = class ClientPoint {
    id;
    code;
    name;
    latitude;
    longitude;
    source;
    groupe;
    creePar;
    createdAt;
    updatedAt;
};
exports.ClientPoint = ClientPoint;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], ClientPoint.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'code', type: 'varchar', length: 64, unique: true }),
    __metadata("design:type", String)
], ClientPoint.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512, nullable: true }),
    __metadata("design:type", Object)
], ClientPoint.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ClientPoint.prototype, "latitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'float' }),
    __metadata("design:type", Number)
], ClientPoint.prototype, "longitude", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ClientPoint.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'groupe', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ClientPoint.prototype, "groupe", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cree_par', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], ClientPoint.prototype, "creePar", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], ClientPoint.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], ClientPoint.prototype, "updatedAt", void 0);
exports.ClientPoint = ClientPoint = __decorate([
    (0, typeorm_1.Entity)({ name: 'poi_clients' }),
    (0, typeorm_1.Index)('ix_poi_clients_code', ['code'])
], ClientPoint);
//# sourceMappingURL=client-point.entity.js.map