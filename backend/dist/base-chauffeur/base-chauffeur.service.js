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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChauffeurService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const base_chauffeur_entity_1 = require("./entities/base-chauffeur.entity");
let BaseChauffeurService = class BaseChauffeurService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    toDto(row) {
        return {
            id: String(row.id),
            nom: row.nom,
            prenom: row.prenom,
            cin: row.cin,
            email: row.email,
            tel: row.tel ?? '',
        };
    }
    async findAll() {
        const rows = await this.repo.find({ order: { nom: 'ASC', prenom: 'ASC' } });
        return { count: rows.length, items: rows.map((r) => this.toDto(r)) };
    }
};
exports.BaseChauffeurService = BaseChauffeurService;
exports.BaseChauffeurService = BaseChauffeurService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(base_chauffeur_entity_1.BaseChauffeur)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], BaseChauffeurService);
//# sourceMappingURL=base-chauffeur.service.js.map