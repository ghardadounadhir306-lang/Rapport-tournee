export interface FlegPriceGrid {
    [zone: string]: {
        [vehicle: string]: number;
    };
}
export declare const flegPricingGrid: FlegPriceGrid;
export declare const flegConfig: {
    kmRate: number;
    defaultBasePrice: number;
};
