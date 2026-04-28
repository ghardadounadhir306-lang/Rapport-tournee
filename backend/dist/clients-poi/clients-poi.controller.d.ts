import { ClientsPoiService, type UpsertClientPoiBody } from './clients-poi.service';
export declare class ClientsPoiController {
    private readonly clientsPoiService;
    constructor(clientsPoiService: ClientsPoiService);
    list(): Promise<{
        count: number;
        items: import("./clients-poi.service").ClientPoiItemDto[];
    }>;
    listDepots(): Promise<{
        count: number;
        items: import("./clients-poi.service").ClientPoiItemDto[];
    }>;
    listClients(): Promise<{
        count: number;
        items: import("./clients-poi.service").ClientPoiItemDto[];
    }>;
    create(body: UpsertClientPoiBody): Promise<import("./clients-poi.service").ClientPoiItemDto>;
    update(code: string, body: UpsertClientPoiBody): Promise<import("./clients-poi.service").ClientPoiItemDto>;
    remove(code: string): Promise<{
        ok: true;
    }>;
    theoreticalKm(body: {
        originCode?: string;
        clientCodes?: string[];
    }): Promise<{
        distances: Record<string, number | null>;
    }>;
    theoreticalKmLegs(body: {
        originCode?: string;
        clientCodes?: string[];
    }): Promise<{
        legKms: (number | null)[];
    }>;
    importExcel(file: {
        buffer: Buffer;
    } | undefined): Promise<{
        count: number;
    }>;
}
