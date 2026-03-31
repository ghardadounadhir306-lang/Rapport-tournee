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
exports.GpsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const gps_service_1 = require("./gps.service");
let GpsController = class GpsController {
    gpsService;
    constructor(gpsService) {
        this.gpsService = gpsService;
    }
    async postPoint(body) {
        const tmsFormId = body.tmsFormId ?? body.tms_form_id;
        return this.gpsService.savePoint({ ...body, tmsFormId: String(tmsFormId ?? '') });
    }
    async postBatch(body) {
        const tmsFormId = body.tmsFormId ?? body.tms_form_id;
        return this.gpsService.saveBatch(String(tmsFormId ?? ''), body.points ?? []);
    }
    async getByTms(id) {
        const points = await this.gpsService.getPointsByTmsFormId(id);
        return {
            tmsFormId: decodeURIComponent(id),
            points: points.map((p) => ({
                id: p.id,
                latitude: p.latitude,
                longitude: p.longitude,
                altitude_m: p.altitude_m,
                speed_mps: p.speed_mps,
                accuracy_m: p.accuracy_m,
                recorded_at: p.recorded_at,
            })),
        };
    }
    async hasRoute(id) {
        const ok = await this.gpsService.hasRealRoute(decodeURIComponent(id));
        return { tmsFormId: decodeURIComponent(id), hasRealRoute: ok };
    }
};
exports.GpsController = GpsController;
__decorate([
    (0, common_1.Post)('points'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GpsController.prototype, "postPoint", null);
__decorate([
    (0, common_1.Post)('points/batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GpsController.prototype, "postBatch", null);
__decorate([
    (0, common_1.Get)('tournee/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GpsController.prototype, "getByTms", null);
__decorate([
    (0, common_1.Get)('tournee/:id/has-route'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GpsController.prototype, "hasRoute", null);
exports.GpsController = GpsController = __decorate([
    (0, swagger_1.ApiTags)('gps'),
    (0, common_1.Controller)(['gps', 'api/gps']),
    __metadata("design:paramtypes", [gps_service_1.GpsService])
], GpsController);
//# sourceMappingURL=gps.controller.js.map