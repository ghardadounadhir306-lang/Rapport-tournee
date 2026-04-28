import { CalculateTarifDto } from '../presentation/dto/calculate-tarif.dto';
export declare class TarifService {
    getStores(): import("../infrastructure/data/storesData").AzizaStore[];
    calculateTarif(dto: CalculateTarifDto): {
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
    private getFlegBasePrice;
    private findTarifRow;
    private getCapacityMeta;
    private computeRemiseKeys;
    private pickRemise;
    private timeToMinutes;
    private calculateDiversTarif;
}
