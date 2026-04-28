import { GpsService } from './gps.service';
import type { CreateGpsPointDto } from './dto/create-gps-point.dto';
export declare class GpsController {
    private readonly gpsService;
    constructor(gpsService: GpsService);
    postPoint(body: CreateGpsPointDto & {
        tmsFormId?: string;
    }): Promise<import("./entities/gps-point.entity").GpsPoint>;
    postBatch(body: {
        tmsFormId?: string;
        points?: CreateGpsPointDto[];
    }): Promise<{
        inserted: number;
    }>;
    getByTms(id: string): Promise<{
        tmsFormId: string;
        points: {
            id: string;
            latitude: string;
            longitude: string;
            altitude_m: number | null;
            speed_mps: number | null;
            accuracy_m: number | null;
            recorded_at: Date;
        }[];
    }>;
    hasRoute(id: string): Promise<{
        tmsFormId: string;
        hasRealRoute: boolean;
    }>;
}
