"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWarehouseCode = isWarehouseCode;
const WAREHOUSE_CODES = new Set([
    'MGH',
    'MHD',
    'BKS',
    'TUN',
    'NAS',
    'SDH',
    'GIAS2',
    'DBH',
    'BAR',
    'SAL',
    'SFX',
    'GAB',
    'GAS',
    'BSL',
    'BIZ',
    'JER',
]);
function isWarehouseCode(code) {
    if (code == null || String(code).trim() === '')
        return false;
    return WAREHOUSE_CODES.has(String(code).trim().toUpperCase());
}
//# sourceMappingURL=warehouse-codes.js.map