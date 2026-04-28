import { Repository } from 'typeorm';
import { Depot } from './entities/depot.entity';
import { ClientPoint } from './entities/client-point.entity';
export type ClientPoiItemDto = {
    code: string;
    nom: string;
    lat: number;
    lng: number;
    isDepot: boolean;
    source: string;
    groupe: string;
    creePar: string;
};
export type UpsertClientPoiBody = {
    code?: string;
    nom?: string;
    latitude?: number;
    longitude?: number;
    isDepot?: boolean;
    source?: string;
    groupe?: string;
    creePar?: string;
};
export declare class ClientsPoiService {
    private readonly depotRepo;
    private readonly clientRepo;
    constructor(depotRepo: Repository<Depot>, clientRepo: Repository<ClientPoint>);
    findAll(): Promise<{
        count: number;
        items: ClientPoiItemDto[];
    }>;
    findAllDepots(): Promise<{
        count: number;
        items: ClientPoiItemDto[];
    }>;
    findAllClients(): Promise<{
        count: number;
        items: ClientPoiItemDto[];
    }>;
    create(body: UpsertClientPoiBody): Promise<ClientPoiItemDto>;
    update(codeRaw: string, body: UpsertClientPoiBody): Promise<ClientPoiItemDto>;
    remove(codeRaw: string): Promise<{
        ok: true;
    }>;
    parseWorkbookBuffer(buffer: Buffer): ClientPoiItemDto[];
    importExcel(buffer: Buffer): Promise<{
        count: number;
    }>;
    theoreticalKmBatch(originCode: string, clientCodes: string[]): Promise<Record<string, number | null>>;
    theoreticalKmLegsAlongTour(originCode: string, orderedClientCodes: string[]): Promise<(number | null)[]>;
}
