"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSiteCodeForDisplay = resolveSiteCodeForDisplay;
const SITE_BY_NUM = {
    '01': 'BAR',
    '05': 'TUN',
    '03': 'BKS',
    '02': 'SAL',
    '04': 'SFX',
    '06': 'GAB',
    '09': 'JER',
    '07': 'GAF',
    '08': 'BSL',
    '10': 'BIZ',
    '11': 'NAS',
    '13': 'MGH',
};
function resolveSiteCodeForDisplay(raw) {
    if (raw === null || raw === undefined)
        return null;
    const t = String(raw).trim().toUpperCase();
    if (!t)
        return null;
    if (/^\d+$/.test(t)) {
        const key = t.padStart(2, '0');
        return SITE_BY_NUM[key] ?? t;
    }
    return t;
}
//# sourceMappingURL=site-code-lookup.js.map