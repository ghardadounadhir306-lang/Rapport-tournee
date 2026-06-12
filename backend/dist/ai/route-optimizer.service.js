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
var RouteOptimizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouteOptimizerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const depot_entity_1 = require("../clients-poi/entities/depot.entity");
const client_point_entity_1 = require("../clients-poi/entities/client-point.entity");
const osrm_route_1 = require("../clients-poi/osrm-route");
const geo_1 = require("../clients-poi/geo");
let RouteOptimizerService = RouteOptimizerService_1 = class RouteOptimizerService {
    depotRepo;
    clientRepo;
    logger = new common_1.Logger(RouteOptimizerService_1.name);
    constructor(depotRepo, clientRepo) {
        this.depotRepo = depotRepo;
        this.clientRepo = clientRepo;
    }
    async optimize(depotCode, clientCodes) {
        const norm = (s) => String(s).trim().toUpperCase().replace(/\s+/g, '');
        const dCode = norm(depotCode);
        const cCodes = clientCodes.map(norm).filter(Boolean);
        if (!dCode)
            throw new Error('Depot code required');
        if (cCodes.length < 2)
            throw new Error('At least 2 clients required for optimization');
        const depot = await this.depotRepo.findOne({ where: { code: dCode } });
        if (!depot)
            throw new Error(`Depot "${dCode}" not found`);
        const clients = await this.clientRepo.find({ where: { code: (0, typeorm_2.In)(cCodes) } });
        const clientMap = new Map(clients.map((c) => [String(c.code).toUpperCase(), c]));
        const coords = [
            { code: dCode, lat: Number(depot.latitude), lng: Number(depot.longitude) },
        ];
        const missingClients = [];
        for (const code of cCodes) {
            const c = clientMap.get(code);
            if (!c) {
                missingClients.push(code);
                continue;
            }
            coords.push({ code, lat: Number(c.latitude), lng: Number(c.longitude) });
        }
        if (coords.length < 3) {
            throw new Error(`Not enough clients with coordinates. Missing: ${missingClients.join(', ')}`);
        }
        const n = coords.length;
        const dist = await this.buildDistanceMatrix(coords);
        const originalIndices = Array.from({ length: n }, (_, i) => i);
        const originalDist = this.routeDistance(originalIndices, dist);
        let tour = this.nearestNeighbor(dist, n);
        tour = this.twoOpt(tour, dist);
        const optimizedDist = this.routeDistance(tour, dist);
        const savingsKm = Math.round((originalDist - optimizedDist) * 100) / 100;
        const savingsPct = originalDist > 0 ? Math.round((savingsKm / originalDist) * 10000) / 100 : 0;
        const legs = [];
        for (let i = 0; i < tour.length; i++) {
            const fromIdx = tour[i];
            const toIdx = tour[(i + 1) % tour.length];
            legs.push({
                from: coords[fromIdx].code,
                to: coords[toIdx].code,
                distanceKm: Math.round(dist[fromIdx][toIdx] * 100) / 100,
            });
        }
        const estimatedTimeSavedMin = Math.round((savingsKm / 50) * 60);
        return {
            originalOrder: cCodes,
            optimizedOrder: tour.filter((i) => i !== 0).map((i) => coords[i].code),
            originalDistanceKm: Math.round(originalDist * 100) / 100,
            optimizedDistanceKm: Math.round(optimizedDist * 100) / 100,
            savingsKm,
            savingsPct,
            estimatedTimeSavedMin,
            legs,
        };
    }
    async buildDistanceMatrix(coords) {
        const n = coords.length;
        const matrix = Array.from({ length: n }, () => Array(n).fill(0));
        const pairs = [];
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                pairs.push({ i, j });
            }
        }
        const batchSize = 5;
        for (let b = 0; b < pairs.length; b += batchSize) {
            const batch = pairs.slice(b, b + batchSize);
            const results = await Promise.all(batch.map(async ({ i, j }) => {
                let km = await (0, osrm_route_1.osrmDrivingKm)(coords[i].lat, coords[i].lng, coords[j].lat, coords[j].lng);
                if (km == null || !Number.isFinite(km)) {
                    km = (0, geo_1.haversineKm)(coords[i].lat, coords[i].lng, coords[j].lat, coords[j].lng);
                }
                return { i, j, km };
            }));
            for (const { i, j, km } of results) {
                matrix[i][j] = km;
                matrix[j][i] = km;
            }
        }
        return matrix;
    }
    routeDistance(tour, dist) {
        let total = 0;
        for (let i = 0; i < tour.length; i++) {
            total += dist[tour[i]][tour[(i + 1) % tour.length]];
        }
        return total;
    }
    nearestNeighbor(dist, n) {
        const visited = new Set([0]);
        const tour = [0];
        let current = 0;
        while (visited.size < n) {
            let nearest = -1;
            let nearestDist = Infinity;
            for (let j = 0; j < n; j++) {
                if (!visited.has(j) && dist[current][j] < nearestDist) {
                    nearest = j;
                    nearestDist = dist[current][j];
                }
            }
            if (nearest === -1)
                break;
            tour.push(nearest);
            visited.add(nearest);
            current = nearest;
        }
        return tour;
    }
    twoOpt(tour, dist) {
        const n = tour.length;
        let improved = true;
        let bestTour = [...tour];
        let bestDist = this.routeDistance(bestTour, dist);
        while (improved) {
            improved = false;
            for (let i = 1; i < n - 1; i++) {
                for (let j = i + 1; j < n; j++) {
                    const newTour = [...bestTour];
                    const segment = newTour.slice(i, j + 1).reverse();
                    newTour.splice(i, segment.length, ...segment);
                    const newDist = this.routeDistance(newTour, dist);
                    if (newDist < bestDist - 0.001) {
                        bestTour = newTour;
                        bestDist = newDist;
                        improved = true;
                    }
                }
            }
        }
        return bestTour;
    }
};
exports.RouteOptimizerService = RouteOptimizerService;
exports.RouteOptimizerService = RouteOptimizerService = RouteOptimizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(depot_entity_1.Depot)),
    __param(1, (0, typeorm_1.InjectRepository)(client_point_entity_1.ClientPoint)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RouteOptimizerService);
//# sourceMappingURL=route-optimizer.service.js.map