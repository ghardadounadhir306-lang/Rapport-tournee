/**
 * Map left sidebar (tournée) rows → bottom "Client" table + form autofill.
 * Event-driven entry point: onClientRowClick(item) — same helpers used after API load.
 */

/** @param {string} [name] */
export function normalizeClientKey(name) {
  if (name == null) return ''
  return String(name).trim().toUpperCase()
}

/**
 * Build one client table row from a tournée list item (UseTmsData / Sidebar).
 * Colonne « Client » = **otdcode** (OTDCODE en base), pas le chauffeur.
 * @param {Record<string, unknown>} item
 */
export function buildClientRowFromTournéeItem(item) {
  const otd =
    item.otdcode != null && String(item.otdcode).trim() !== ''
      ? String(item.otdcode).trim()
      : ''
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    client: otd,
    dep: item.dep != null && item.dep !== '' ? String(item.dep) : '',
    um: '',
    pal: '',
    arrivee: '',
    depart: '',
    kmArv: '',
    taxe: '',
    livree: false,
    kmTh: '',
    region: item.site != null ? String(item.site) : '',
  }
}

/**
 * Append a client row from the tournée unless the same client is already present.
 * @param {Array<Record<string, unknown>>} rows
 * @param {Record<string, unknown>} item
 */
export function appendClientRowIfNotDuplicate(rows, item) {
  const candidate = buildClientRowFromTournéeItem(item)
  const key = normalizeClientKey(candidate.client)
  if (!key) return rows

  if (rows.some((r) => normalizeClientKey(r.client) === key)) {
    return rows
  }

  const onlyBlank =
    rows.length === 1 && !normalizeClientKey(rows[0]?.client)
  if (onlyBlank) {
    return [candidate]
  }
  return [...rows, candidate]
}

/**
 * Fill empty form fields from the selected tournée (does not wipe saved API values).
 *
 * Event-driven usage (standalone `onClientRowClick` without API):
 *   setTableRows((prev) => appendClientRowIfNotDuplicate(prev, item))
 *   setFormData((prev) => ({ ...prev, ...pickFormAutofillFromTournéeItem(item, prev) }))
 *
 * Integrated flow: `mergeLoadedFormWithItem` + `appendClientRowIfNotDuplicate` in `handleSelectItem`.
 *
 * @param {Record<string, unknown>} item
 * @param {Record<string, unknown>} prev
 */
export function pickFormAutofillFromTournéeItem(item, prev = {}) {
  const p = prev && typeof prev === 'object' ? prev : {}
  const or = (a, b) => (a != null && a !== '' ? a : b ?? '')
  return {
    date: or(p.date, item.date),
    wms: or(p.wms, item.wms),
    prestation: or(p.prestation, item.prestation),
    truck: or(p.truck, item.truck),
    driver: or(p.driver, item.driver),
    dep: or(p.dep, item.dep),
  }
}

/**
 * Merge server form payload with tournée item defaults.
 * @param {Record<string, unknown>} fd
 * @param {Record<string, unknown>} item
 */
export function mergeLoadedFormWithItem(fd, item) {
  const next = { ...fd }
  const or = (k, fallback) => {
    const v = next[k]
    return v != null && v !== '' ? v : fallback ?? ''
  }
  return {
    ...next,
    date: or('date', item.date),
    wms: or('wms', item.wms),
    prestation: or('prestation', item.prestation),
    truck: or('truck', item.truck),
    driver: or('driver', item.driver),
    dep: or('dep', item.dep),
  }
}
