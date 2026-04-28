import { Repository } from 'typeorm';
import { Anomaly } from '../anomalies/entities/anomaly.entity';
import { TmsFormData } from '../tms/entities/tms-form-data.entity';
import { GpsService } from '../gps/gps.service';
export type AlertSeverity = 'INFO' | 'ALERTE' | 'BLOQUANT';
export type OperationalAlert = {
    code: string;
    severity: AlertSeverity;
    message: string;
    tmsFormId?: string;
    meta?: Record<string, unknown>;
};
export declare class AlertsService {
    private readonly formRepo;
    private readonly anomalyRepo;
    private readonly gpsService;
    constructor(formRepo: Repository<TmsFormData>, anomalyRepo: Repository<Anomaly>, gpsService: GpsService);
    private loadPersistedAnomaliesAsAlerts;
    private persistedCodesByTour;
    getAlerts(filters: {
        tmsFormId?: string;
        date?: string;
    }): Promise<OperationalAlert[]>;
}
