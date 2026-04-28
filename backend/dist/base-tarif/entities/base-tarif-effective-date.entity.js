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
exports.BaseTarifEffectiveDate = void 0;
const typeorm_1 = require("typeorm");
let BaseTarifEffectiveDate = class BaseTarifEffectiveDate {
    id;
    dateIso;
    sortOrder;
    createdAt;
};
exports.BaseTarifEffectiveDate = BaseTarifEffectiveDate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BaseTarifEffectiveDate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_iso', type: 'varchar', length: 10, unique: true }),
    __metadata("design:type", String)
], BaseTarifEffectiveDate.prototype, "dateIso", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], BaseTarifEffectiveDate.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], BaseTarifEffectiveDate.prototype, "createdAt", void 0);
exports.BaseTarifEffectiveDate = BaseTarifEffectiveDate = __decorate([
    (0, typeorm_1.Entity)({ name: 'base_tarif_effective_date' })
], BaseTarifEffectiveDate);
//# sourceMappingURL=base-tarif-effective-date.entity.js.map