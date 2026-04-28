import { AnomaliesService } from './anomalies.service';
export declare class AnomaliesController {
    private readonly anomaliesService;
    constructor(anomaliesService: AnomaliesService);
    list(tourneeId?: string, limit?: string, offset?: string): Promise<{
        total: number;
        limit: number;
        offset: number;
        anomalies: {
            id: number;
            tournee_id: string;
            prestation_id: string | null;
            camion_id: string | null;
            anomaly_type_id: number;
            type_code: string;
            type_label: string;
            description: string | null;
            created_at: string;
        }[];
    }>;
}
