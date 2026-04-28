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
exports.BaseTarifAugmentation = void 0;
const typeorm_1 = require("typeorm");
let BaseTarifAugmentation = class BaseTarifAugmentation {
    id;
    percent;
    dateEffet;
    appliedBy;
    description;
    createdAt;
};
exports.BaseTarifAugmentation = BaseTarifAugmentation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], BaseTarifAugmentation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], BaseTarifAugmentation.prototype, "percent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date_effet', type: 'date' }),
    __metadata("design:type", String)
], BaseTarifAugmentation.prototype, "dateEffet", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'applied_by', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], BaseTarifAugmentation.prototype, "appliedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], BaseTarifAugmentation.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp', precision: 3 }),
    __metadata("design:type", Date)
], BaseTarifAugmentation.prototype, "createdAt", void 0);
exports.BaseTarifAugmentation = BaseTarifAugmentation = __decorate([
    (0, typeorm_1.Entity)({ name: 'base_tarif_augmentation' })
], BaseTarifAugmentation);
//# sourceMappingURL=base-tarif-augmentation.entity.js.map