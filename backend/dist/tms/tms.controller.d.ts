import { TmsService } from './tms.service';
export declare class TmsController {
    private readonly tmsService;
    constructor(tmsService: TmsService);
    getTmsData(): {
        entriesCount: number;
        list: never[];
        active: null;
    };
}
