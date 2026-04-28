/**
 * Mappe une ligne brute `transport_data` (clés PG en général minuscules) vers le même
 * format que les entrées du sidebar (`/api/tms`), pour ouvrir la tournée depuis le dashboard.
 *
 * Relation données ↔ `client_pois` :
 * - `sitcode` → site de départ (doit exister dans `client_pois` comme `client_code`, idéalement dépôt)
 * - `otdcode` → client livré (même `client_code` dans `client_pois`)
 */

function rowVal(row, key) {
  if (!row || typeof row !== 'object') return ''
  const lk = key.toLowerCase()
  for (const k of Object.keys(row)) {
    if (k.toLowerCase() === lk) {
      const v = row[k]
      if (v == null) return ''
      return String(v).trim()
    }
  }
  return ''
}

/**
 * @param {Record<string, unknown>} row
 * @returns {{ id: string, tms: string | null, wms: string, date: string | null, site: string | null, truck: string | null, driver: string, otdcode: string | null, dep: string | null, prestation: null, active: boolean } | null}
 */
export function transportRowToListItem(row) {
  const voycle = rowVal(row, 'voycle')
  const otdcode = rowVal(row, 'otdcode')
  const otsnum = rowVal(row, 'otsnum')
  const toucode = rowVal(row, 'toucode')
  let tms = voycle
  if (!tms && /^\d+$/.test(otdcode)) tms = otdcode
  if (!tms) tms = otsnum || toucode || ''
  if (!tms) return null

  const cdate = rowVal(row, 'cdate')
  let date = null
  if (cdate) {
    const iso = cdate.match(/^(\d{4}-\d{2}-\d{2})/)
    if (iso) date = iso[1]
    else {
      const fr = cdate.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
      if (fr) date = `${fr[3]}-${fr[2]}-${fr[1]}`
    }
  }

  const sitcode = rowVal(row, 'sitcode')

  return {
    id: `tms-${tms}`,
    tms,
    wms: '0',
    date,
    site: sitcode || null,
    truck: rowVal(row, 'plamoti') || null,
    driver: rowVal(row, 'salnom') || '',
    otdcode: otdcode || null,
    dep: rowVal(row, 'tiecode') || null,
    prestation: null,
    active: false,
  }
}
