/**
 * Normalise la valeur SITCODE issue de la base (déjà le code affichable, ex. BAR, TUN).
 * Plus de table num_site → code_site : la colonne sitcode est la source de vérité.
 */
const SITE_BY_NUM: Record<string, string> = {
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

export function resolveSiteCodeForDisplay(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const t = String(raw).trim().toUpperCase();
  if (!t) return null;
  if (/^\d+$/.test(t)) {
    const key = t.padStart(2, '0');
    return SITE_BY_NUM[key] ?? t;
  }
  return t;
}
