import { OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
export declare class DashboardService implements OnModuleDestroy {
    private readonly rtourneeDs;
    private tmsDs;
    constructor(rtourneeDs: DataSource);
    onModuleDestroy(): Promise<void>;
    private getTmsDs;
    private tmsQuery;
    private rtourneeQuery;
    getStats(periodeStr: string): Promise<{
        periode: number;
        global: {
            totalTournees: number;
            totalSaisies: number;
            totalChauffeurs: number;
            totalKm: number;
            tauxSaisieGlobal: number;
        };
        tauxSaisieParJour: {
            jour: string;
            total: number;
            saisies: number;
            taux: number;
        }[];
        tarifParJour: {
            jour: string;
            km: number;
        }[];
        tarifParMois: {
            mois: any;
            km: number;
        }[];
        mobiliteParChauffeur: {
            driver: any;
            saisies: number;
            total: number | null;
            tauxMobilite: number;
        }[];
    }>;
}
