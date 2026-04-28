import { Repository } from 'typeorm';
import { Anomaly } from './entities/anomaly.entity';
export declare class AnomaliesService {
    private readonly anomalyRepo;
    constructor(anomalyRepo: Repository<Anomaly>);
    list(filters: {
        tourneeId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
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
