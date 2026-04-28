export type ClientDiversVehicleKey =
    | 'picup'
    | 'nkr'
    | 'npr'
    | 'nprIveco'
    | 'iveco'
    | 'mercedes'
    | 'semi';

export interface ClientDiversZoneTarifs {
    [zone: string]: number;
}

export interface ClientDiversZoneVehiculeTarifs {
    [zone: string]: {
        [vehicle in ClientDiversVehicleKey]?: number;
    };
}

/**
 * Client Divers
 * calcul = besoin * tarifZone
 * remise 50% si départ = retour (même lieu)
 *
 * Remarque: valeurs ci-dessous = exemples (à remplacer par les vrais montants).
 */
export const clientDiversZoneTarifs: ClientDiversZoneTarifs = {
    // Fallback per zone (when vehicule-specific tariff is missing)
    // Aligné sur le tarif du véhicule par défaut (NKR).
    TUNIS: 55,
    SAHEL: 65,
    SFAX: 80,
};

/**
 * Variante plus précise: tarif حسب zone + véhicule.
 * Si une valeur manque, le backend peut fallback sur `clientDiversZoneTarifs`.
 * Remarque: valeurs ci-dessous = exemples (à remplacer par les vrais montants).
 */
export const clientDiversZoneVehiculeTarifs: ClientDiversZoneVehiculeTarifs = {
    TUNIS: {
        picup: 45,
        nkr: 55,
        npr: 60,
        nprIveco: 65,
        iveco: 70,
        mercedes: 75,
        semi: 90,
    },
    SAHEL: {
        picup: 55,
        nkr: 65,
        npr: 70,
        nprIveco: 75,
        iveco: 80,
        mercedes: 85,
        semi: 105,
    },
    SFAX: {
        picup: 70,
        nkr: 80,
        npr: 85,
        nprIveco: 90,
        iveco: 95,
        mercedes: 100,
        semi: 125,
    },
};

export const clientDiversConfig = {
    remiseMemeLieuRetour: 0.5,
    defaultZone: 'TUNIS',
    defaultVehicule: 'nkr' as ClientDiversVehicleKey,
};
