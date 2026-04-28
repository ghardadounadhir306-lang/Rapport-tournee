"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCamionModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const base_camion_controller_1 = require("./base-camion.controller");
const base_camion_service_1 = require("./base-camion.service");
const base_camion_entity_1 = require("./entities/base-camion.entity");
let BaseCamionModule = class BaseCamionModule {
};
exports.BaseCamionModule = BaseCamionModule;
exports.BaseCamionModule = BaseCamionModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([base_camion_entity_1.BaseCamion])],
        controllers: [base_camion_controller_1.BaseCamionController],
        providers: [base_camion_service_1.BaseCamionService],
        exports: [base_camion_service_1.BaseCamionService],
    })
], BaseCamionModule);
//# sourceMappingURL=base-camion.module.js.map