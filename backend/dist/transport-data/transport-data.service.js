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
exports.TransportDataService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transport_data_entity_1 = require("./entities/transport-data.entity");
const transport_depot_entity_1 = require("./entities/transport-depot.entity");
const transport_poi_client_entity_1 = require("./entities/transport-poi-client.entity");
let TransportDataService = class TransportDataService {
    transportRepo;
    depotLinkRepo;
    clientLinkRepo;
    constructor(transportRepo, depotLinkRepo, clientLinkRepo) {
        this.transportRepo = transportRepo;
        this.depotLinkRepo = depotLinkRepo;
        this.clientLinkRepo = clientLinkRepo;
    }
    async create(data) {
        const transport = this.transportRepo.create({
            ...data,
            states: 'pending',
        });
        return this.transportRepo.save(transport);
    }
    async findAll() {
        return this.transportRepo.find();
    }
    async findOne(id) {
        return this.transportRepo.findOneOrFail({ where: { id } });
    }
    async update(id, data) {
        await this.transportRepo.update(id, data);
        return this.findOne(id);
    }
    async remove(id) {
        await this.transportRepo.delete(id);
    }
    async addDepotLink(transportId, depotId) {
        const link = this.depotLinkRepo.create({ transport_id: transportId, depot_id: depotId });
        return this.depotLinkRepo.save(link);
    }
    async addClientLink(transportId, clientId) {
        const link = this.clientLinkRepo.create({ transport_id: transportId, poi_client_id: clientId });
        return this.clientLinkRepo.save(link);
    }
    async getDepots(transportId) {
        return this.depotLinkRepo.find({ where: { transport_id: transportId } });
    }
    async getClientPoints(transportId) {
        return this.clientLinkRepo.find({ where: { transport_id: transportId } });
    }
};
exports.TransportDataService = TransportDataService;
exports.TransportDataService = TransportDataService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transport_data_entity_1.TransportData)),
    __param(1, (0, typeorm_1.InjectRepository)(transport_depot_entity_1.TransportDepot)),
    __param(2, (0, typeorm_1.InjectRepository)(transport_poi_client_entity_1.TransportPoiClient)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TransportDataService);
//# sourceMappingURL=transport-data.service.js.map