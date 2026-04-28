export interface AzizaStore {
    id: string;
    name: string;
    sector: string;
}

export const azizaStores: AzizaStore[] = [
    // Sector: Tunis
    { id: 'tn-01', name: 'Aziza Ariana Centre', sector: 'Tunis' },
    { id: 'tn-02', name: 'Aziza Ennasr', sector: 'Tunis' },
    { id: 'tn-03', name: 'Aziza Bardo', sector: 'Tunis' },
    { id: 'tn-04', name: 'Aziza Ben Arous', sector: 'Tunis' },
    { id: 'tn-05', name: 'Aziza Mourouj', sector: 'Tunis' },

    // Sector: Nord
    { id: 'nd-01', name: 'Aziza Bizerte Ville', sector: 'Nord' },
    { id: 'nd-02', name: 'Aziza Menzel Bourguiba', sector: 'Nord' },
    { id: 'nd-03', name: 'Aziza Nabeul', sector: 'Nord' },
    { id: 'nd-04', name: 'Aziza Hammamet', sector: 'Nord' },

    // Sector: Sahel
    { id: 'sh-01', name: 'Aziza Sousse Khzema', sector: 'Sahel' },
    { id: 'sh-02', name: 'Aziza Monastir Centre', sector: 'Sahel' },
    { id: 'sh-03', name: 'Aziza Mahdia', sector: 'Sahel' },

    // Sector: Sud
    { id: 'sd-01', name: 'Aziza Sfax Ville', sector: 'Sud' },
    { id: 'sd-02', name: 'Aziza Gabes', sector: 'Sud' },
    { id: 'sd-03', name: 'Aziza Medenine', sector: 'Sud' },
    { id: 'sd-04', name: 'Aziza Djerba', sector: 'Sud' },
];
