export type ClientDiversVehicleKey = 'picup' | 'nkr' | 'npr' | 'nprIveco' | 'iveco' | 'mercedes' | 'semi';
export interface ClientDiversZoneTarifs {
    [zone: string]: number;
}
export interface ClientDiversZoneVehiculeTarifs {
    [zone: string]: {
        [vehicle in ClientDiversVehicleKey]?: number;
    };
}
export declare const clientDiversZoneTarifs: ClientDiversZoneTarifs;
export declare const clientDiversZoneVehiculeTarifs: ClientDiversZoneVehiculeTarifs;
export declare const clientDiversConfig: {
    remiseMemeLieuRetour: number;
    defaultZone: string;
    defaultVehicule: ClientDiversVehicleKey;
};
