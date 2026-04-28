export const diversData = {
    // 1. Divers Aziza
    diversAziza: {
        // a. Transfert Inter Magasin (trp16)
        transfertInterMagazin: {
            // Contains a "tournee glode facture avec tarif retour"
            tarifs: {
                baseRetours: 50, // Exemple de tarif pour calculer = rayon * nbr palettes livrees
                // facturation tarif retour
            }
        },
        // b. Transfert Technique (trp14)
        transfertTechnique: {
            // calcul = besoin client * rayon
            // remise 50% si camion revient avec marchandise
            remiseRetourAvecMarchandise: 0.50
        },
        // c. Transfert Retour (trp13)
        transfertRetour: {
            // calcul = nbr palette * tarif zone
            zones: {
                'Gabes et Sfax': 120, // Exemple
                'Tunis et Sahlin': 80, // Exemple
                'Cap Bon': 90 // Exemple
            }
        },
        // d. Tarif Anexe (trp33)
        tarifAnexe: {
            // calcul = nbr de palette livrees * tarif anexe
            tarifDeBase: 15 // Exemple 15 DT par palette
        },
        // e. Tarif OCT (trp10)
        tarifOct: {
            // ceux qui peuvent se permettre tarif aziza sont qui viennent oct sousse vers oct bar et oct sousse vers oct mhamdiya
            sousseVersBar: 200, // Exemple
            sousseVersMhamdiya: 250, // Exemple

            // Tarif sucre par zone (à remplir avec les vrais montants)
            zones: {
                'Zone A': 0,
                'Zone B': 0,
                'Zone C': 0,
            }
        },
        // f. Transport sur Achat (trp6)
        transportSurAchat: {
            // calcul = besoin (cargo et semi) * km
            tauxKm: {
                cargo: 2.5, // Exemple
                semi: 3.5 // Exemple
            }
        },
        // g. Transfert Inter Depot Spot (trp15)
        transfertInterDepotSpot: {
            // calcul = rayon * nbr de palettes
            // quand on a 2 cargo appliquer tarif semi (tarif semi pour 2 cargo)
            // et chaque transfert 50% remise
            tauxPaletteRayon: {
                cargo: 1.2, // Exemple
                semi: 1.6,  // Exemple
            },
            remise: 0.50
        },
        // h. Transport Surgelé
        transportSurgele: {
            // besoin * rayon (tarif frais aziza) + add 15% de la somme de tarif
            majorationSurgele: 0.15,
            tarifFraisAziza: 2.0 // Exemple
        },
        // i. Transfert Lilas (trp12)
        transfertLilas: {
            // calcul = besoin * km
            tauxKm: 2.2 // Exemple
        }
    },

    // 2. Industries et CSM (trp23)
    industriesEtCsm: {
        // Backward-compat (ancien champ)
        tqnfTractage: 300,
    },

    // 3. Client Divers
    clientDivers: {
        // destination * besoin
        // meme lieu de depart et retour -> oui = remise 50% sur le retour
        remiseMemeLieuRetour: 0.50,
        tauxDestinationBesoin: 50 // Exemple de multiplicateur
    },

    // 4. Vielavie Glace (trp4)
    vielavieGlace: {
        // Option 1: livreé frigos vers mon debowatna (bar we sfax we sahlin we na3san we sidi thahir)
        // tout passe par mghiraa -> tarif = besoin * R (cargo besoin only)
        optionMghiraa: {
            R: 75 // Exemple de constante R
        },
        // Option 2: livree frigo de mghiraa des autres clients
        // Tarif Freezer (NPR/NKR/Cargo) + Frais Stationnement
        optionAutresClients: {
            tarifFreezer: 150, // Exemple
            fraisStationnement: 20 // Exemple
        }
    },

    // 5. Surgele (trp8)
    surgele: {
        // calcul = rayon * (tarif frais aziza) * zoneFactor
        // NOTE: `zoneFactor` est préféré. `zones` reste en fallback (ancien mode: DT/km).
        zoneFactor: {
            'Zone A': 1.0,
            'Zone B': 1.25,
            'Zone C': 1.5,
        },
        zones: {
            'Zone A': 10, // Fallback ancien mode (DT/km) — à remplacer si vous l'utilisez encore
            'Zone B': 15,
            'Zone C': 20,
        },
    }
};
