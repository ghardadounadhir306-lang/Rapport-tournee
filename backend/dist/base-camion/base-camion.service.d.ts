import { Repository } from 'typeorm';
import { BaseCamion } from './entities/base-camion.entity';
export type BaseCamionItemDto = {
    id: string;
    camion: string;
    marque: string;
    site: string;
    type: string;
    affectation: string;
    capacite: string;
    utile: string;
};
export type UpsertBaseCamionBody = {
    camion?: string;
    marque?: string;
    site?: string;
    type?: string;
    affectation?: string;
    capacite?: string;
    utile?: string;
};
export declare class BaseCamionService {
    private readonly repo;
    constructor(repo: Repository<BaseCamion>);
    private toDto;
    findAll(): Promise<{
        count: number;
        items: BaseCamionItemDto[];
    }>;
    create(body: UpsertBaseCamionBody): Promise<BaseCamionItemDto>;
    update(idRaw: string, body: UpsertBaseCamionBody): Promise<BaseCamionItemDto>;
    remove(idRaw: string): Promise<{
        ok: true;
    }>;
    parseWorkbookBuffer(buffer: Buffer): BaseCamionItemDto[];
    importExcel(buffer: Buffer): Promise<{
        count: number;
    }>;
}
