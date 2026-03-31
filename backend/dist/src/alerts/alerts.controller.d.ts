import { AlertsService } from './alerts.service';
export declare class AlertsController {
    private readonly alertsService;
    constructor(alertsService: AlertsService);
    list(tourneeId?: string, date?: string): Promise<{
        count: number;
        alerts: import("./alerts.service").OperationalAlert[];
    }>;
}
