"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransportDataModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transport_data_entity_1 = require("./entities/transport-data.entity");
const transport_depot_entity_1 = require("./entities/transport-depot.entity");
const transport_poi_client_entity_1 = require("./entities/transport-poi-client.entity");
const transport_data_service_1 = require("./transport-data.service");
const transport_data_controller_1 = require("./transport-data.controller");
let TransportDataModule = class TransportDataModule {
};
exports.TransportDataModule = TransportDataModule;
exports.TransportDataModule = TransportDataModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                transport_data_entity_1.TransportData,
                transport_depot_entity_1.TransportDepot,
                transport_poi_client_entity_1.TransportPoiClient,
            ]),
        ],
        providers: [transport_data_service_1.TransportDataService],
        controllers: [transport_data_controller_1.TransportDataController],
        exports: [transport_data_service_1.TransportDataService],
    })
], TransportDataModule);
//# sourceMappingURL=transport-data.module.js.map