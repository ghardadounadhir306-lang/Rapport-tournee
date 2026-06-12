import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Depot } from '../clients-poi/entities/depot.entity';
import { ClientPoint } from '../clients-poi/entities/client-point.entity';
import { osrmDrivingKm } from '../clients-poi/osrm-route';
import { haversineKm } from '../clients-poi/geo';

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

interface Coord {
  code: string;
  lat: number;
  lng: number;
}

@Injectable()
export class RouteOptimizerService {
  private readonly logger = new Logger(RouteOptimizerService.name);

  constructor(
    @InjectRepository(Depot)
    private readonly depotRepo: Repository<Depot>,
    @InjectRepository(ClientPoint)
    private readonly clientRepo: Repository<ClientPoint>,
  ) {}

  /**
   * Optimize a delivery route given a depot code and ordered list of client codes.
   * Uses Nearest-Neighbor heuristic + 2-opt improvement to solve TSP.
   */
  async optimize(depotCode: string, clientCodes: string[]): Promise<OptimizedRoute> {
    const norm = (s: string) => String(s).trim().toUpperCase().replace(/\s+/g, '');
    const dCode = norm(depotCode);
    const cCodes = clientCodes.map(norm).filter(Boolean);

    if (!dCode) throw new Error('Depot code required');
    if (cCodes.length < 2) throw new Error('At least 2 clients required for optimization');

    // Fetch coordinates
    const depot = await this.depotRepo.findOne({ where: { code: dCode } });
    if (!depot) throw new Error(`Depot "${dCode}" not found`);

    const clients = await this.clientRepo.find({ where: { code: In(cCodes) } });
    const clientMap = new Map(clients.map((c) => [String(c.code).toUpperCase(), c]));

    // Build coordinate list: [depot, ...clients]
    const coords: Coord[] = [
      { code: dCode, lat: Number(depot.latitude), lng: Number(depot.longitude) },
    ];
    const missingClients: string[] = [];
    for (const code of cCodes) {
      const c = clientMap.get(code);
      if (!c) {
        missingClients.push(code);
        continue;
      }
      coords.push({ code, lat: Number(c.latitude), lng: Number(c.longitude) });
    }

    if (coords.length < 3) {
      throw new Error(
        `Not enough clients with coordinates. Missing: ${missingClients.join(', ')}`,
      );
    }

    // Build distance matrix using OSRM
    const n = coords.length;
    const dist = await this.buildDistanceMatrix(coords);

    // Calculate original route distance (depot → c1 → c2 → ... → depot)
    const originalIndices = Array.from({ length: n }, (_, i) => i);
    const originalDist = this.routeDistance(originalIndices, dist);

    // Nearest-Neighbor heuristic starting from depot (index 0)
    let tour = this.nearestNeighbor(dist, n);

    // 2-opt improvement
    tour = this.twoOpt(tour, dist);

    const optimizedDist = this.routeDistance(tour, dist);
    const savingsKm = Math.round((originalDist - optimizedDist) * 100) / 100;
    const savingsPct = originalDist > 0 ? Math.round((savingsKm / originalDist) * 10000) / 100 : 0;

    // Build legs
    const legs: OptimizedRoute['legs'] = [];
    for (let i = 0; i < tour.length; i++) {
      const fromIdx = tour[i];
      const toIdx = tour[(i + 1) % tour.length];
      legs.push({
        from: coords[fromIdx].code,
        to: coords[toIdx].code,
        distanceKm: Math.round(dist[fromIdx][toIdx] * 100) / 100,
      });
    }

    // Estimated time saved (avg speed 50 km/h)
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

  private async buildDistanceMatrix(coords: Coord[]): Promise<number[][]> {
    const n = coords.length;
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    // Build all unique pairs
    const pairs: Array<{ i: number; j: number }> = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        pairs.push({ i, j });
      }
    }

    // Process in parallel batches (max 5 concurrent OSRM requests)
    const batchSize = 5;
    for (let b = 0; b < pairs.length; b += batchSize) {
      const batch = pairs.slice(b, b + batchSize);
      const results = await Promise.all(
        batch.map(async ({ i, j }) => {
          let km = await osrmDrivingKm(
            coords[i].lat,
            coords[i].lng,
            coords[j].lat,
            coords[j].lng,
          );
          if (km == null || !Number.isFinite(km)) {
            km = haversineKm(coords[i].lat, coords[i].lng, coords[j].lat, coords[j].lng);
          }
          return { i, j, km };
        }),
      );
      for (const { i, j, km } of results) {
        matrix[i][j] = km;
        matrix[j][i] = km; // Symmetric approximation
      }
    }

    return matrix;
  }

  private routeDistance(tour: number[], dist: number[][]): number {
    let total = 0;
    for (let i = 0; i < tour.length; i++) {
      total += dist[tour[i]][tour[(i + 1) % tour.length]];
    }
    return total;
  }

  private nearestNeighbor(dist: number[][], n: number): number[] {
    const visited = new Set<number>([0]);
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
      if (nearest === -1) break;
      tour.push(nearest);
      visited.add(nearest);
      current = nearest;
    }

    return tour;
  }

  private twoOpt(tour: number[], dist: number[][]): number[] {
    const n = tour.length;
    let improved = true;
    let bestTour = [...tour];
    let bestDist = this.routeDistance(bestTour, dist);

    while (improved) {
      improved = false;
      for (let i = 1; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          const newTour = [...bestTour];
          // Reverse the segment between i and j
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
}
