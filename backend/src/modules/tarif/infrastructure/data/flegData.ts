export interface FlegPriceGrid {
    [zone: string]: {
        [vehicle: string]: number;
    };
}

/**
 * Grille tarifaire pour Fleg
 * Vous pouvez modifier les prix ici directement.
 */
export const flegPricingGrid: FlegPriceGrid = {
    TUN: {
        dmax: 50,
        nkr: 70
    },
    BIZ: {
        dmax: 100,
        nkr: 130
    },
    CAP: {
        dmax: 110,
        nkr: 140
    },
    SAH: {
        dmax: 150,
        nkr: 190
    },
    SFAX: {
        dmax: 200,
        nkr: 250
    }
};

/**
 * Paramètres de calcul Fleg
 */
export const flegConfig = {
    kmRate: 0.5, // Le prix par Km
    defaultBasePrice: 50
};
