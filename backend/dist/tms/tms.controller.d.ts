import { TmsService } from './tms.service';
export declare class TmsController {
    private readonly tmsService;
    constructor(tmsService: TmsService);
    getTmsData(): Promise<{
        entriesCount: number;
        list: {
            id: string;
            wms: string | null;
            date: string | null;
            site: string | null;
            truck: string | null;
            driver: string;
            dep: string | null;
            prestation: string | null;
            active: boolean;
        }[];
        active: null;
    }>;
    importTmsExcel(file?: {
        buffer: Buffer;
    }): Promise<{
        sheetName: string;
        rowsDetected: number;
        inserted: number;
    }>;
}
