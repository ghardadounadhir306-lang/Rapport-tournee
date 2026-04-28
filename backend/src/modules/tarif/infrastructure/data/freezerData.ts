export type FreezerVehicleKey = 'cargo' | 'nkr' | 'npr';

export type FreezerKmBucket =
    | 25 | 50 | 75 | 100 | 125
    | 150 | 175 | 200 | 225 | 250
    | 275 | 300 | 325 | 350 | 375
    | 400 | 425 | 450 | 475 | 500;

type FreezerTarifsByKm = Record<FreezerKmBucket, number>;

const buildTarifsByKm = (base25: number, stepPer25km: number): FreezerTarifsByKm => {
    const buckets: FreezerKmBucket[] = [
        25, 50, 75, 100, 125,
        150, 175, 200, 225, 250,
        275, 300, 325, 350, 375,
        400, 425, 450, 475, 500,
    ];

    const out: Partial<FreezerTarifsByKm> = {};
    buckets.forEach((b, idx) => {
        out[b] = base25 + idx * stepPer25km;
    });
    return out as FreezerTarifsByKm;
};

/**
 * Vielavie Glace (trp4)
 *
 * 1) Livrée frigos vers nos dépôts (Bar / Sfax / Sahel / Naâssen / Sidi Thahir)
 *    Tout passe par Mghiraa.
 *    Tarif = besoin * R
 *    (besoin = nombre de cargo)
 *
 * 2) Livrée frigo de Mghiraa pour des autres clients
 *    Tarif = Tarif Freezer (NPR/NKR/Cargo) + Frais Stationnement
 *
 * Remarque: valeurs ci-dessous = exemples (à remplacer par les vrais montants).
 */
export const freezerData = {
    // Option 1 (via Mghiraa)
    mghiraa: {
        R: 75,
    },

    // Option 2 (autres clients)
    autresClients: {
        // Tarif Freezer حسب kilometrage (buckets 25km حتى 500km) و حسب véhicule.
        // مثال: cargo => 25km=100, 50km=125 ...
        tarifsFreezerByKm: {
            cargo: buildTarifsByKm(100, 25),
            nkr: buildTarifsByKm(110, 25),
            npr: buildTarifsByKm(120, 25),
        } satisfies Record<FreezerVehicleKey, FreezerTarifsByKm>,
        fraisStationnement: 20,
        defaultVehicule: 'cargo' as FreezerVehicleKey,
        maxKm: 500 as const,
    },
};
