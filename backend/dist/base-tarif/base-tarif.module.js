"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTarifModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const base_tarif_controller_1 = require("./base-tarif.controller");
const base_tarif_service_1 = require("./base-tarif.service");
const base_tarif_augmentation_entity_1 = require("./entities/base-tarif-augmentation.entity");
const base_tarif_effective_date_entity_1 = require("./entities/base-tarif-effective-date.entity");
const base_tarif_entity_1 = require("./entities/base-tarif.entity");
let BaseTarifModule = class BaseTarifModule {
};
exports.BaseTarifModule = BaseTarifModule;
exports.BaseTarifModule = BaseTarifModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([base_tarif_entity_1.BaseTarif, base_tarif_effective_date_entity_1.BaseTarifEffectiveDate, base_tarif_augmentation_entity_1.BaseTarifAugmentation])],
        controllers: [base_tarif_controller_1.BaseTarifController],
        providers: [base_tarif_service_1.BaseTarifService],
        exports: [base_tarif_service_1.BaseTarifService],
    })
], BaseTarifModule);
//# sourceMappingURL=base-tarif.module.js.map