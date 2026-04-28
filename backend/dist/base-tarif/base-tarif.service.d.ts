import { Repository } from 'typeorm';
import { BaseTarifAugmentation } from './entities/base-tarif-augmentation.entity';
import { BaseTarifEffectiveDate } from './entities/base-tarif-effective-date.entity';
import { BaseTarif } from './entities/base-tarif.entity';
export type BaseTarifItemDto = {
    id: string;
    typeCode: string;
    distMin: number;
    distMax: number;
    capMin: number;
    capMax: number;
    tarifBase: number | null;
    tarifsParDate: Record<string, number>;
    creePar: string;
};
export type UpsertBaseTarifBody = {
    typeCode?: string;
    distMin?: number;
    distMax?: number;
    capMin?: number;
    capMax?: number;
    tarifBase?: number | null;
    tarifsParDate?: Record<string, number | null>;
    creePar?: string;
};
export declare class BaseTarifService {
    private readonly repo;
    private readonly dateRepo;
    private readonly augRepo;
    constructor(repo: Repository<BaseTarif>, dateRepo: Repository<BaseTarifEffectiveDate>, augRepo: Repository<BaseTarifAugmentation>);
    getEffectiveDatesList(): Promise<string[]>;
    private normalizeDateIso;
    addEffectiveDate(dateRaw: string): Promise<{
        dates: string[];
    }>;
    private registerDatesFromTarifKeys;
    private toDto;
    private validateRanges;
    findAll(): Promise<{
        count: number;
        items: BaseTarifItemDto[];
    }>;
    findMatchingTarif(typeCode: string, distance: number, capacity: number): Promise<BaseTarifItemDto & {
        augmentationPercent: number;
    } | null>;
    create(body: UpsertBaseTarifBody): Promise<BaseTarifItemDto>;
    private normalizeTarifsJson;
    update(idRaw: string, body: UpsertBaseTarifBody): Promise<BaseTarifItemDto>;
    remove(idRaw: string): Promise<{
        ok: true;
    }>;
    createAugmentation(body: {
        percent: number;
        dateEffet: string;
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
    listAugmentations(): Promise<{
        id: number;
        percent: number;
        dateEffet: string;
        appliedBy: string;
        description: string;
        active: boolean;
    }[]>;
    deleteAugmentation(id: number): Promise<{
        ok: boolean;
    }>;
    getAugmentationFactor(dateIso?: string): Promise<number>;
    private toAugDto;
    parseWorkbookBuffer(buffer: Buffer): Omit<BaseTarifItemDto, 'id'>[];
    importExcel(buffer: Buffer): Promise<{
        count: number;
    }>;
}
