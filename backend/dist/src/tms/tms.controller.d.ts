import { TmsService } from './tms.service';
export declare class TmsController {
    private readonly tmsService;
    constructor(tmsService: TmsService);
    getTmsData(query: Record<string, string>): Promise<{
        entriesCount: number;
        list: {
            id: string;
            tms: string | null;
            wms: string | null;
            date: string | null;
            site: string | null;
            truck: string | null;
            driver: string;
            otdcode: string | null;
            dep: string | null;
            prestation: string | null;
            active: boolean;
        }[];
        active: null;
    }>;
    getFormData(id: string): Promise<{
        id: string;
        tms_id: string | null;
        table_rows: any;
        tableRows: any;
        input_data: {
            date: string | null;
            wms: string | null;
            prestation: string | null;
            truck: string | null;
            driver: string | null;
            dep: string | null;
            kmFacture: string | null;
            marchandise: string | null;
            conformite: string | null;
            observation: string | null;
            hDepart: string | null;
            kmDepart: string | null;
            hRetour: string | null;
            kmRetour: string | null;
            kmDernierClient: string | null;
            kmMoy: string | null;
            totalPalettes: string | null;
            totalPalettes2: string | null;
            tourneeSec: string | null;
            apresMidi: boolean;
            interSite: boolean;
            gpsStartLat: string;
            gpsStartLng: string;
            gpsEndLat: string;
            gpsEndLng: string;
            gpsStartLabel: string;
            gpsEndLabel: string;
        };
        formData: {
            date: string | null;
            wms: string | null;
            prestation: string | null;
            truck: string | null;
            driver: string | null;
            dep: string | null;
            kmFacture: string | null;
            marchandise: string | null;
            conformite: string | null;
            observation: string | null;
            hDepart: string | null;
            kmDepart: string | null;
            hRetour: string | null;
            kmRetour: string | null;
            kmDernierClient: string | null;
            kmMoy: string | null;
            totalPalettes: string | null;
            totalPalettes2: string | null;
            tourneeSec: string | null;
            apresMidi: boolean;
            interSite: boolean;
            gpsStartLat: string;
            gpsStartLng: string;
            gpsEndLat: string;
            gpsEndLng: string;
            gpsStartLabel: string;
            gpsEndLabel: string;
        };
    } | {
        id: string;
        tms_id: string;
        table_rows: never[];
        tableRows: never[];
        input_data: {};
        formData: {};
    }>;
    getTransportData(limit?: string): Promise<{
        count: number;
        rows: any[];
    }>;
    saveFormData(id: string, body: any): Promise<import("./entities/tms-form-data.entity").TmsFormData>;
    importTmsExcel(file?: {
        buffer: Buffer;
    }): Promise<{
        sheetName: string;
        rowsDetected: number;
        inserted: number;
    }>;
}
