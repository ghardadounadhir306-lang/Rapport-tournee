// ─── Pure text/filter helpers ───────────────────────────────────────────────

export const normalizeText = (value) =>
  (value == null ? '' : String(value)).trim().toLowerCase()

export const parseQuery = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) return { mode: 'any', value: '' }
  if (raw.startsWith('=')) return { mode: 'exact', value: raw.slice(1).trim() }
  return { mode: 'contains', value: raw }
}

export const matches = (fieldValue, query) => {
  if (!query.value) return true
  const left = normalizeText(fieldValue)
  const right = normalizeText(query.value)
  if (query.mode === 'exact') return left === right
  return left.includes(right)
}

export const normalizeDateQuery = (value) => {
  const s = normalizeText(value)
  if (!s) return ''
  const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`
  return s
}

export const applyFilters = (list, tmsFilters) => {
  const q = {
    wms: parseQuery(tmsFilters.wms),
    tms: parseQuery(tmsFilters.tms),
    date: parseQuery(normalizeDateQuery(tmsFilters.date)),
    site: parseQuery(tmsFilters.site),
    truck: parseQuery(tmsFilters.truck),
    driver: parseQuery(tmsFilters.driver),
    dep: parseQuery(tmsFilters.dep),
    prestation: parseQuery(tmsFilters.prestation),
  }

  return list.filter((item) => {
    const tmsNumber = normalizeText(item?.id).replace(/^tms-/, '')
    return (
      matches(item?.wms, q.wms) &&
      (q.tms.value
        ? (q.tms.mode === 'exact'
            ? tmsNumber === normalizeText(q.tms.value) || normalizeText(item?.id) === normalizeText(q.tms.value)
            : tmsNumber.includes(normalizeText(q.tms.value)) || normalizeText(item?.id).includes(normalizeText(q.tms.value)))
        : true) &&
      matches(item?.date, q.date) &&
      matches(item?.site, q.site) &&
      matches(item?.truck, q.truck) &&
      matches(item?.driver, q.driver) &&
      matches(item?.dep, q.dep) &&
      matches(item?.prestation, q.prestation)
    )
  })
}