export type FreezerVehicleKey = 'cargo' | 'nkr' | 'npr';
export type FreezerKmBucket = 25 | 50 | 75 | 100 | 125 | 150 | 175 | 200 | 225 | 250 | 275 | 300 | 325 | 350 | 375 | 400 | 425 | 450 | 475 | 500;
type FreezerTarifsByKm = Record<FreezerKmBucket, number>;
export declare const freezerData: {
    mghiraa: {
        R: number;
    };
    autresClients: {
        tarifsFreezerByKm: {
            cargo: FreezerTarifsByKm;
            nkr: FreezerTarifsByKm;
            npr: FreezerTarifsByKm;
        };
        fraisStationnement: number;
        defaultVehicule: FreezerVehicleKey;
        maxKm: 500;
    };
};
export {};
