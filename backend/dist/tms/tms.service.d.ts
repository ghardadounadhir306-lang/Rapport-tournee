import { Repository } from 'typeorm';
import { TmsImportRow } from './entities/tms-import-row.entity';
export declare class TmsService {
    private readonly tmsImportRowRepo;
    constructor(tmsImportRowRepo: Repository<TmsImportRow>);
    getData(): Promise<{
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
    importExcel(buffer: Buffer): Promise<{
        sheetName: string;
        rowsDetected: number;
        inserted: number;
    }>;
    private normalizeHeader;
    private normalizeRowKeys;
    private asString;
    private asInt;
    private asDecimalString;
    private asDateOnly;
    private asDateTime;
    private mapExcelRow;
    private isRowEmpty;
    private formatDateOnly;
    private pickTmsNumber;
    private mapRowToListItem;
    private buildListFromRows;
    private normalizeUiDate;
    private readOtsnumbdxFromRawJson;
    private fetchRowsWithoutOtsnumbdx;
}
