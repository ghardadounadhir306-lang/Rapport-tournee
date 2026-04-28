import { BaseTarifService, type UpsertBaseTarifBody } from './base-tarif.service';
export declare class BaseTarifController {
    private readonly baseTarifService;
    constructor(baseTarifService: BaseTarifService);
    list(): Promise<{
        count: number;
        items: import("./base-tarif.service").BaseTarifItemDto[];
    }>;
    effectiveDates(): Promise<{
        dates: string[];
    }>;
    addEffectiveDate(body: {
        date?: string;
    }): Promise<{
        dates: string[];
    }>;
    lookup(typeCode?: string, distRaw?: string, capRaw?: string): Promise<{
        match: (import("./base-tarif.service").BaseTarifItemDto & {
            augmentationPercent: number;
        }) | null;
    }>;
    create(body: UpsertBaseTarifBody): Promise<import("./base-tarif.service").BaseTarifItemDto>;
    update(id: string, body: UpsertBaseTarifBody): Promise<import("./base-tarif.service").BaseTarifItemDto>;
    remove(id: string): Promise<{
        ok: true;
    }>;
    importExcel(file: {
        buffer: Buffer;
    } | undefined): Promise<{
        count: number;
    }>;
    listAugmentations(): Promise<{
        id: number;
        percent: number;
        dateEffet: string;
        appliedBy: string;
        description: string;
        active: boolean;
    }[]>;
    createAugmentation(body: {
        percent?: number;
        dateEffet?: string;
        appliedBy?: string;
        description?: string;
    }): Promise<{
        id: number;
        percent: number;
        dateEffet: string;
        appliedBy: string;
        description: string;
        active: boolean;
    }>;
    deleteAugmentation(id: string): Promise<{
        ok: boolean;
    }>;
    augmentationFactor(dateIso?: string): Promise<{
        factor: number;
        percent: number;
    }>;
}
