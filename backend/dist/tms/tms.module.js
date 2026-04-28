"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TmsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const anomalies_module_1 = require("../anomalies/anomalies.module");
const clients_poi_module_1 = require("../clients-poi/clients-poi.module");
const tms_controller_1 = require("./tms.controller");
const tms_service_1 = require("./tms.service");
const tms_import_row_entity_1 = require("./entities/tms-import-row.entity");
const tms_form_data_entity_1 = require("./entities/tms-form-data.entity");
const tour_leg_km_sample_entity_1 = require("./entities/tour-leg-km-sample.entity");
const tour_leg_km_history_service_1 = require("./tour-leg-km-history.service");
let TmsModule = class TmsModule {
};
exports.TmsModule = TmsModule;
exports.TmsModule = TmsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([tms_import_row_entity_1.TmsImportRow, tms_form_data_entity_1.TmsFormData, tour_leg_km_sample_entity_1.TourLegKmSample]),
            anomalies_module_1.AnomaliesModule,
            clients_poi_module_1.ClientsPoiModule,
        ],
        controllers: [tms_controller_1.TmsController],
        providers: [tms_service_1.TmsService, tour_leg_km_history_service_1.TourLegKmHistoryService],
    })
], TmsModule);
//# sourceMappingURL=tms.module.js.map