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
exports.TmsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const tms_service_1 = require("./tms.service");
let TmsController = class TmsController {
    tmsService;
    constructor(tmsService) {
        this.tmsService = tmsService;
    }
    getTmsData(query) {
        return this.tmsService.getData(query ?? {});
    }
    getFormData(id) {
        return this.tmsService.getFormData(id);
    }
    getTransportData(limit) {
        return this.tmsService.getTransportData(limit);
    }
    saveFormData(id, body) {
        return this.tmsService.saveFormData(id, body);
    }
    importTmsExcel(file) {
        if (!file) {
            throw new common_1.BadRequestException('Missing file (field name: file)');
        }
        return this.tmsService.importExcel(file.buffer);
    }
};
exports.TmsController = TmsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TmsController.prototype, "getTmsData", null);
__decorate([
    (0, common_1.Get)('form-data/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TmsController.prototype, "getFormData", null);
__decorate([
    (0, common_1.Get)('transport-data'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TmsController.prototype, "getTransportData", null);
__decorate([
    (0, common_1.Post)('form-data/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TmsController.prototype, "saveFormData", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TmsController.prototype, "importTmsExcel", null);
exports.TmsController = TmsController = __decorate([
    (0, common_1.Controller)(['tms', 'api/tms']),
    __metadata("design:paramtypes", [tms_service_1.TmsService])
], TmsController);
//# sourceMappingURL=tms.controller.js.map