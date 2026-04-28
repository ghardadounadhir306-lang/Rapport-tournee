declare class StoreDto {
    name?: string;
    palettes?: number;
    time?: string;
    duration?: string;
}
declare class MerchandiseDto {
    codeArticle?: string;
    nbPalettes?: number | string;
    vehicule?: string;
}
export declare class CalculateTarifDto {
    km?: number;
    palettes?: number;
    nbMagasins?: number;
    storeDurations?: string[];
    nature: string;
    tourneeType?: string;
    deliveryTime?: string;
    stores?: StoreDto[];
    vehicleType?: string;
    zone?: string;
    diversCategory?: string;
    diversSubCategory?: string;
    vehicule?: string;
    besoin?: number | string;
    isReturnTrip?: boolean;
    hasReturnedGoods?: boolean;
    tarifAnexe?: number;
    isSousseOctBar?: boolean;
    isSousseOctMhamdiya?: boolean;
    applyFiftyPercentRemise?: boolean;
    destination?: string;
    isSameDepartureAndReturn?: boolean;
    surgelaOption?: string;
    merchandises?: MerchandiseDto[];
    nbCargo?: number;
}
export {};
