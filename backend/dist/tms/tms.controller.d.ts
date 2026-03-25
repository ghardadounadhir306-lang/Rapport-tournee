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
    getFormData(id: string): Promise<{}>;
    createTmsData(body: any): Promise<{
        success: boolean;
    }>;
    updateTmsData(id: string, body: any): Promise<{
        success: boolean;
    }>;
    importTmsExcel(file?: {
        buffer: Buffer;
    }): Promise<{
        sheetName: string;
        rowsDetected: number;
        inserted: number;
    }>;
}
