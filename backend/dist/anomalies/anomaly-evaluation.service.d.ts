import { Repository } from 'typeorm';
import { TmsFormData } from '../tms/entities/tms-form-data.entity';
import { ANOMALY_TYPE_CODES } from './anomaly-type-codes';
import { Anomaly } from './entities/anomaly.entity';
import { AnomalyType } from './entities/anomaly-type.entity';
export { ANOMALY_TYPE_CODES };
export declare class AnomalyEvaluationService {
    private readonly formRepo;
    private readonly anomalyRepo;
    private readonly typeRepo;
    private readonly logger;
    private typeIdsCache;
    constructor(formRepo: Repository<TmsFormData>, anomalyRepo: Repository<Anomaly>, typeRepo: Repository<AnomalyType>);
    private typeIdsByCode;
    evaluateAfterSave(tourneeId: string): Promise<void>;
    private deleteForTourAndCodes;
    private refreshSingleTourAnomalies;
    private refreshDuplicationCluster;
}
