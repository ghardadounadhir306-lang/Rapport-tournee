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
exports.ClientsPoiController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const clients_poi_service_1 = require("./clients-poi.service");
let ClientsPoiController = class ClientsPoiController {
    clientsPoiService;
    constructor(clientsPoiService) {
        this.clientsPoiService = clientsPoiService;
    }
    list() {
        return this.clientsPoiService.findAll();
    }
    listDepots() {
        return this.clientsPoiService.findAllDepots();
    }
    listClients() {
        return this.clientsPoiService.findAllClients();
    }
    create(body) {
        return this.clientsPoiService.create(body);
    }
    update(code, body) {
        return this.clientsPoiService.update(decodeURIComponent(code), body);
    }
    remove(code) {
        return this.clientsPoiService.remove(decodeURIComponent(code));
    }
    theoreticalKm(body) {
        const originCode = String(body?.originCode ?? '').trim();
        const clientCodes = Array.isArray(body?.clientCodes) ? body.clientCodes : [];
        return this.clientsPoiService.theoreticalKmBatch(originCode, clientCodes).then((distances) => ({
            distances,
        }));
    }
    theoreticalKmLegs(body) {
        const originCode = String(body?.originCode ?? '').trim();
        const clientCodes = Array.isArray(body?.clientCodes) ? body.clientCodes : [];
        return this.clientsPoiService.theoreticalKmLegsAlongTour(originCode, clientCodes).then((legKms) => ({
            legKms,
        }));
    }
    importExcel(file) {
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Fichier manquant (champ multipart : file)');
        }
        return this.clientsPoiService.importExcel(file.buffer);
    }
};
exports.ClientsPoiController = ClientsPoiController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('depots'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "listDepots", null);
__decorate([
    (0, common_1.Get)('clients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "listClients", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':code'),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('theoretical-km'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "theoreticalKm", null);
__decorate([
    (0, common_1.Post)('theoretical-km-legs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "theoreticalKmLegs", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ClientsPoiController.prototype, "importExcel", null);
exports.ClientsPoiController = ClientsPoiController = __decorate([
    (0, common_1.Controller)('api/clients-poi'),
    __metadata("design:paramtypes", [clients_poi_service_1.ClientsPoiService])
], ClientsPoiController);
//# sourceMappingURL=clients-poi.controller.js.map