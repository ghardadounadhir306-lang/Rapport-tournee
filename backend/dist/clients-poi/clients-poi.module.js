"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsPoiModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const clients_poi_controller_1 = require("./clients-poi.controller");
const clients_poi_service_1 = require("./clients-poi.service");
const client_poi_entity_1 = require("./entities/client-poi.entity");
const depot_entity_1 = require("./entities/depot.entity");
const client_point_entity_1 = require("./entities/client-point.entity");
let ClientsPoiModule = class ClientsPoiModule {
};
exports.ClientsPoiModule = ClientsPoiModule;
exports.ClientsPoiModule = ClientsPoiModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([client_poi_entity_1.ClientPoi, depot_entity_1.Depot, client_point_entity_1.ClientPoint])],
        controllers: [clients_poi_controller_1.ClientsPoiController],
        providers: [clients_poi_service_1.ClientsPoiService],
        exports: [clients_poi_service_1.ClientsPoiService],
    })
], ClientsPoiModule);
//# sourceMappingURL=clients-poi.module.js.map