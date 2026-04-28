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
exports.CalculateTarifDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class StoreDto {
    name;
    palettes;
    time;
    duration;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], StoreDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], StoreDto.prototype, "palettes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], StoreDto.prototype, "time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], StoreDto.prototype, "duration", void 0);
class MerchandiseDto {
    codeArticle;
    nbPalettes;
    vehicule;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MerchandiseDto.prototype, "codeArticle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], MerchandiseDto.prototype, "nbPalettes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], MerchandiseDto.prototype, "vehicule", void 0);
class CalculateTarifDto {
    km;
    palettes;
    nbMagasins;
    storeDurations;
    nature;
    tourneeType;
    deliveryTime;
    stores;
    vehicleType;
    zone;
    diversCategory;
    diversSubCategory;
    vehicule;
    besoin;
    isReturnTrip;
    hasReturnedGoods;
    tarifAnexe;
    isSousseOctBar;
    isSousseOctMhamdiya;
    applyFiftyPercentRemise;
    destination;
    isSameDepartureAndReturn;
    surgelaOption;
    merchandises;
    nbCargo;
}
exports.CalculateTarifDto = CalculateTarifDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CalculateTarifDto.prototype, "km", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CalculateTarifDto.prototype, "palettes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CalculateTarifDto.prototype, "nbMagasins", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], CalculateTarifDto.prototype, "storeDurations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "nature", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "tourneeType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "deliveryTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [StoreDto] }),
    __metadata("design:type", Array)
], CalculateTarifDto.prototype, "stores", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "vehicleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "zone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "diversCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "diversSubCategory", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "vehicule", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], CalculateTarifDto.prototype, "besoin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], CalculateTarifDto.prototype, "isReturnTrip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], CalculateTarifDto.prototype, "hasReturnedGoods", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CalculateTarifDto.prototype, "tarifAnexe", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], CalculateTarifDto.prototype, "isSousseOctBar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], CalculateTarifDto.prototype, "isSousseOctMhamdiya", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], CalculateTarifDto.prototype, "applyFiftyPercentRemise", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "destination", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Boolean)
], CalculateTarifDto.prototype, "isSameDepartureAndReturn", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CalculateTarifDto.prototype, "surgelaOption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [MerchandiseDto] }),
    __metadata("design:type", Array)
], CalculateTarifDto.prototype, "merchandises", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CalculateTarifDto.prototype, "nbCargo", void 0);
//# sourceMappingURL=calculate-tarif.dto.js.map