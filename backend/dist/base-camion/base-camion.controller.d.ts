import { BaseCamionService, type UpsertBaseCamionBody } from './base-camion.service';
export declare class BaseCamionController {
    private readonly baseCamionService;
    constructor(baseCamionService: BaseCamionService);
    list(): Promise<{
        count: number;
        items: import("./base-camion.service").BaseCamionItemDto[];
    }>;
    create(body: UpsertBaseCamionBody): Promise<import("./base-camion.service").BaseCamionItemDto>;
    update(id: string, body: UpsertBaseCamionBody): Promise<import("./base-camion.service").BaseCamionItemDto>;
    remove(id: string): Promise<{
        ok: true;
    }>;
    importExcel(file: {
        buffer: Buffer;
    } | undefined): Promise<{
        count: number;
    }>;
}
