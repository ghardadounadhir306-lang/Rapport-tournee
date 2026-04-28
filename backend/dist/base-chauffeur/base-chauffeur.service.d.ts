import { Repository } from 'typeorm';
import { BaseChauffeur } from './entities/base-chauffeur.entity';
export type BaseChauffeurDto = {
    id: string;
    nom: string;
    prenom: string;
    cin: string;
    email: string;
    tel: string;
};
export declare class BaseChauffeurService {
    private readonly repo;
    constructor(repo: Repository<BaseChauffeur>);
    private toDto;
    findAll(): Promise<{
        count: number;
        items: BaseChauffeurDto[];
    }>;
}
