import { TarifService } from '../application/tarif.service';
import { CalculateTarifDto } from './dto/calculate-tarif.dto';
export declare class TarifController {
    private readonly tarifService;
    constructor(tarifService: TarifService);
    getStores(): import("../infrastructure/data/storesData").AzizaStore[];
    calculate(dto: CalculateTarifDto): {
        input: CalculateTarifDto;
        matchedRow: any;
        tarifUnit: number;
        tarifRaw: number;
        coefficient: number;
        nbMagasins: number;
        hasMajoration: boolean;
        remisePercent: number;
        remiseAmount: number;
        applyRemise: boolean;
        storesBreakdown: any[] | null;
        total: number;
    };
}
