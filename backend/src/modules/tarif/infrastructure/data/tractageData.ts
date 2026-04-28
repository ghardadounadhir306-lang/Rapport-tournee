export interface TractageSiteKmRateGrid {
    [site: string]: number;
}

export interface TractageVehicleFactorGrid {
    [vehicle: string]: number;
}

/**
 * Tractage (Industries & CSM — trp23)
 * calcul = rayon(km) * nb_vehicules * kmRate(site) * factor(vehicule)
 *
 * Remarque: valeurs ci-dessous = exemples (à remplacer par les vrais montants).
 */
export const tractageSiteKmRate: TractageSiteKmRateGrid = {
    zit: 1.0,
    wadLil: 1.0,
    dandan: 1.0,
    migrin: 1.0,
};

export const tractageVehicleFactor: TractageVehicleFactorGrid = {
    picup: 0.8,
    nkr: 1.0,
    npr: 1.1,
    nprIveco: 1.2,
    iveco: 1.3,
    mercedes: 1.4,
    semi: 1.5,
};

export const tractageConfig = {
    defaultKmRate: 1.0,
    destinationLabel: 'Bouargoub',
    defaultVehicleFactor: 1.0,
};
