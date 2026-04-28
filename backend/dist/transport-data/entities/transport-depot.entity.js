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
exports.TransportDepot = void 0;
const typeorm_1 = require("typeorm");
const transport_data_entity_1 = require("./transport-data.entity");
const depot_entity_1 = require("../../clients-poi/entities/depot.entity");
let TransportDepot = class TransportDepot {
    transport_id;
    depot_id;
    transport;
    depot;
};
exports.TransportDepot = TransportDepot;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'integer' }),
    __metadata("design:type", Number)
], TransportDepot.prototype, "transport_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'bigint' }),
    __metadata("design:type", String)
], TransportDepot.prototype, "depot_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => transport_data_entity_1.TransportData, (transport) => transport.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'transport_id' }),
    __metadata("design:type", transport_data_entity_1.TransportData)
], TransportDepot.prototype, "transport", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => depot_entity_1.Depot, (depot) => depot.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'depot_id' }),
    __metadata("design:type", depot_entity_1.Depot)
], TransportDepot.prototype, "depot", void 0);
exports.TransportDepot = TransportDepot = __decorate([
    (0, typeorm_1.Entity)({ name: 'transport_depots' })
], TransportDepot);
//# sourceMappingURL=transport-depot.entity.js.map