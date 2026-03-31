import { Repository } from 'typeorm';
import { GpsPoint } from './entities/gps-point.entity';
import type { CreateGpsPointDto } from './dto/create-gps-point.dto';
export declare class GpsService {
    private readonly gpsRepo;
    constructor(gpsRepo: Repository<GpsPoint>);
    savePoint(dto: CreateGpsPointDto & {
        tmsFormId: string;
    }): Promise<GpsPoint>;
    saveBatch(tmsFormId: string, points: CreateGpsPointDto[]): Promise<{
        inserted: number;
    }>;
    getPointsByTmsFormId(tmsFormId: string): Promise<GpsPoint[]>;
    hasRealRoute(tmsFormId: string): Promise<boolean>;
}
