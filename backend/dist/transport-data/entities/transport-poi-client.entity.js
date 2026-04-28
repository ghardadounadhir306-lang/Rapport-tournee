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
exports.TransportPoiClient = void 0;
const typeorm_1 = require("typeorm");
const transport_data_entity_1 = require("./transport-data.entity");
const client_point_entity_1 = require("../../clients-poi/entities/client-point.entity");
let TransportPoiClient = class TransportPoiClient {
    transport_id;
    poi_client_id;
    transport;
    clientPoint;
};
exports.TransportPoiClient = TransportPoiClient;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'integer' }),
    __metadata("design:type", Number)
], TransportPoiClient.prototype, "transport_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], TransportPoiClient.prototype, "poi_client_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => transport_data_entity_1.TransportData, (transport) => transport.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'transport_id' }),
    __metadata("design:type", transport_data_entity_1.TransportData)
], TransportPoiClient.prototype, "transport", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_point_entity_1.ClientPoint, (client) => client.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'poi_client_id' }),
    __metadata("design:type", client_point_entity_1.ClientPoint)
], TransportPoiClient.prototype, "clientPoint", void 0);
exports.TransportPoiClient = TransportPoiClient = __decorate([
    (0, typeorm_1.Entity)({ name: 'transport_poi_clients' })
], TransportPoiClient);
//# sourceMappingURL=transport-poi-client.entity.js.map