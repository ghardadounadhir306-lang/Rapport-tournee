import { Repository } from 'typeorm';
import { TourLegKmSample } from './entities/tour-leg-km-sample.entity';
export declare class TourLegKmHistoryService {
    private readonly repo;
    constructor(repo: Repository<TourLegKmSample>);
    private normalizeSite;
    private normalizeClient;
    private parseKmTh;
    getAverage(sitcodeRaw: string | null | undefined, clientCode: string | null | undefined): Promise<number | null>;
    recordSamples(tmsFormId: string, sitcodeRaw: string | null | undefined, rows: Array<{
        client?: unknown;
        kmTh?: unknown;
    }>): Promise<void>;
}
