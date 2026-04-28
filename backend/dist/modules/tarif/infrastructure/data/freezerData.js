"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.freezerData = void 0;
const buildTarifsByKm = (base25, stepPer25km) => {
    const buckets = [
        25, 50, 75, 100, 125,
        150, 175, 200, 225, 250,
        275, 300, 325, 350, 375,
        400, 425, 450, 475, 500,
    ];
    const out = {};
    buckets.forEach((b, idx) => {
        out[b] = base25 + idx * stepPer25km;
    });
    return out;
};
exports.freezerData = {
    mghiraa: {
        R: 75,
    },
    autresClients: {
        tarifsFreezerByKm: {
            cargo: buildTarifsByKm(100, 25),
            nkr: buildTarifsByKm(110, 25),
            npr: buildTarifsByKm(120, 25),
        },
        fraisStationnement: 20,
        defaultVehicule: 'cargo',
        maxKm: 500,
    },
};
//# sourceMappingURL=freezerData.js.map