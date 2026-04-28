import { AnomalyType } from './anomaly-type.entity';
export declare class Anomaly {
    id: number;
    tourneeId: string;
    prestationId: string | null;
    camionId: string | null;
    anomalyType: AnomalyType;
    anomalyTypeId: number;
    description: string | null;
    createdAt: Date;
}
