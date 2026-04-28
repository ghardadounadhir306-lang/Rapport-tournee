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
exports.BaseTarifController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const base_tarif_service_1 = require("./base-tarif.service");
let BaseTarifController = class BaseTarifController {
    baseTarifService;
    constructor(baseTarifService) {
        this.baseTarifService = baseTarifService;
    }
    list() {
        return this.baseTarifService.findAll();
    }
    effectiveDates() {
        return this.baseTarifService.getEffectiveDatesList().then((dates) => ({ dates }));
    }
    addEffectiveDate(body) {
        const d = body?.date;
        if (d === undefined || d === null || String(d).trim() === '') {
            throw new common_1.BadRequestException('Body : { "date": "AAAA-MM-JJ" }');
        }
        return this.baseTarifService.addEffectiveDate(String(d));
    }
    async lookup(typeCode, distRaw, capRaw) {
        if (!typeCode || !distRaw || !capRaw) {
            throw new common_1.BadRequestException('Paramètres requis : typeCode, distance, capacity');
        }
        const dist = Number(distRaw);
        const cap = Number(capRaw);
        if (!Number.isFinite(dist) || !Number.isFinite(cap)) {
            throw new common_1.BadRequestException('distance et capacity doivent être des nombres');
        }
        const match = await this.baseTarifService.findMatchingTarif(typeCode, dist, cap);
        return { match };
    }
    create(body) {
        return this.baseTarifService.create(body);
    }
    update(id, body) {
        return this.baseTarifService.update(id, body);
    }
    remove(id) {
        return this.baseTarifService.remove(id);
    }
    importExcel(file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Fichier manquant (champ multipart : file)');
        }
        return this.baseTarifService.importExcel(file.buffer);
    }
    listAugmentations() {
        return this.baseTarifService.listAugmentations();
    }
    createAugmentation(body) {
        if (body?.percent === undefined || !body?.dateEffet) {
            throw new common_1.BadRequestException('Body : { "percent": number, "dateEffet": "AAAA-MM-JJ" }');
        }
        return this.baseTarifService.createAugmentation({
            percent: body.percent,
            dateEffet: body.dateEffet,
            appliedBy: body.appliedBy,
            description: body.description,
        });
    }
    deleteAugmentation(id) {
        return this.baseTarifService.deleteAugmentation(Number(id));
    }
    async augmentationFactor(dateIso) {
        const factor = await this.baseTarifService.getAugmentationFactor(dateIso || undefined);
        return { factor, percent: Math.round((factor - 1) * 10000) / 100 };
    }
};
exports.BaseTarifController = BaseTarifController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('effective-dates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "effectiveDates", null);
__decorate([
    (0, common_1.Post)('effective-dates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "addEffectiveDate", null);
__decorate([
    (0, common_1.Get)('lookup'),
    __param(0, (0, common_1.Query)('typeCode')),
    __param(1, (0, common_1.Query)('distance')),
    __param(2, (0, common_1.Query)('capacity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], BaseTarifController.prototype, "lookup", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "importExcel", null);
__decorate([
    (0, common_1.Get)('augmentations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "listAugmentations", null);
__decorate([
    (0, common_1.Post)('augmentations'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "createAugmentation", null);
__decorate([
    (0, common_1.Delete)('augmentations/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BaseTarifController.prototype, "deleteAugmentation", null);
__decorate([
    (0, common_1.Get)('augmentation-factor'),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BaseTarifController.prototype, "augmentationFactor", null);
exports.BaseTarifController = BaseTarifController = __decorate([
    (0, common_1.Controller)('api/base-tarif'),
    __metadata("design:paramtypes", [base_tarif_service_1.BaseTarifService])
], BaseTarifController);
//# sourceMappingURL=base-tarif.controller.js.map