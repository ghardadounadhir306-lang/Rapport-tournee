import { BaseChauffeurService } from './base-chauffeur.service';
export declare class BaseChauffeurController {
    private readonly baseChauffeurService;
    constructor(baseChauffeurService: BaseChauffeurService);
    list(): Promise<{
        count: number;
        items: import("./base-chauffeur.service").BaseChauffeurDto[];
    }>;
}
