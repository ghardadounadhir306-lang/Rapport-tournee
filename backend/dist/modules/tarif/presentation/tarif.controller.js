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
exports.TarifController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tarif_service_1 = require("../application/tarif.service");
const calculate_tarif_dto_1 = require("./dto/calculate-tarif.dto");
let TarifController = class TarifController {
    tarifService;
    constructor(tarifService) {
        this.tarifService = tarifService;
    }
    getStores() {
        return this.tarifService.getStores();
    }
    calculate(dto) {
        return this.tarifService.calculateTarif(dto);
    }
};
exports.TarifController = TarifController;
__decorate([
    (0, common_1.Get)('stores'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of Aziza stores' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stores successfully retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TarifController.prototype, "getStores", null);
__decorate([
    (0, common_1.Post)('calculate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate tarif based on distance, palettes, and stores' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pricing successfully calculated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing required parameters or Sector mismatch' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No matching tarif row found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [calculate_tarif_dto_1.CalculateTarifDto]),
    __metadata("design:returntype", void 0)
], TarifController.prototype, "calculate", null);
exports.TarifController = TarifController = __decorate([
    (0, swagger_1.ApiTags)('Tarif'),
    (0, common_1.Controller)('api/tarif'),
    __metadata("design:paramtypes", [tarif_service_1.TarifService])
], TarifController);
//# sourceMappingURL=tarif.controller.js.map