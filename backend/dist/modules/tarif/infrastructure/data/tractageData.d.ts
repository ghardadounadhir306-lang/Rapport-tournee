export interface TractageSiteKmRateGrid {
    [site: string]: number;
}
export interface TractageVehicleFactorGrid {
    [vehicle: string]: number;
}
export declare const tractageSiteKmRate: TractageSiteKmRateGrid;
export declare const tractageVehicleFactor: TractageVehicleFactorGrid;
export declare const tractageConfig: {
    defaultKmRate: number;
    destinationLabel: string;
    defaultVehicleFactor: number;
};
