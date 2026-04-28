/**
 * Codes dépôts / entrepôts (même jeu que le frontend routeOptimizer/constants.js).
 * À garder aligné si vous ajoutez un site.
 */
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

export function isWarehouseCode(code: string | null | undefined): boolean {
  if (code == null || String(code).trim() === '') return false;
  return WAREHOUSE_CODES.has(String(code).trim().toUpperCase());
}
