"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChauffeurModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const base_chauffeur_controller_1 = require("./base-chauffeur.controller");
const base_chauffeur_service_1 = require("./base-chauffeur.service");
const base_chauffeur_entity_1 = require("./entities/base-chauffeur.entity");
let BaseChauffeurModule = class BaseChauffeurModule {
};
exports.BaseChauffeurModule = BaseChauffeurModule;
exports.BaseChauffeurModule = BaseChauffeurModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([base_chauffeur_entity_1.BaseChauffeur])],
        controllers: [base_chauffeur_controller_1.BaseChauffeurController],
        providers: [base_chauffeur_service_1.BaseChauffeurService],
        exports: [base_chauffeur_service_1.BaseChauffeurService],
    })
], BaseChauffeurModule);
//# sourceMappingURL=base-chauffeur.module.js.map