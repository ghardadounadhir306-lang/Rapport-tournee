import { Repository } from 'typeorm';
import { Depot } from '../clients-poi/entities/depot.entity';
import { ClientPoint } from '../clients-poi/entities/client-point.entity';
export interface OptimizedRoute {
    originalOrder: string[];
    optimizedOrder: string[];
    originalDistanceKm: number;
    optimizedDistanceKm: number;
    savingsKm: number;
    savingsPct: number;
    estimatedTimeSavedMin: number;
    legs: Array<{
        from: string;
        to: string;
        distanceKm: number;
    }>;
}
export declare class RouteOptimizerService {
    private readonly depotRepo;
    private readonly clientRepo;
    private readonly logger;
    constructor(depotRepo: Repository<Depot>, clientRepo: Repository<ClientPoint>);
    optimize(depotCode: string, clientCodes: string[]): Promise<OptimizedRoute>;
    private buildDistanceMatrix;
    private routeDistance;
    private nearestNeighbor;
    private twoOpt;
}
