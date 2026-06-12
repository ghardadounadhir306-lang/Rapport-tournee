import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getStats(periode?: string): Promise<{
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
