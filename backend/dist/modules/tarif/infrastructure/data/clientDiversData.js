"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientDiversConfig = exports.clientDiversZoneVehiculeTarifs = exports.clientDiversZoneTarifs = void 0;
exports.clientDiversZoneTarifs = {
    TUNIS: 55,
    SAHEL: 65,
    SFAX: 80,
};
exports.clientDiversZoneVehiculeTarifs = {
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
exports.clientDiversConfig = {
    remiseMemeLieuRetour: 0.5,
    defaultZone: 'TUNIS',
    defaultVehicule: 'nkr',
};
//# sourceMappingURL=clientDiversData.js.map