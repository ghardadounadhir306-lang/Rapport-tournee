import { apiUrl } from './apiBase'

/** @param {number} km */
function fmtKm(km) {
  return String(Number(km).toFixed(2)).replace('.', ',')
}

/**
 * Carte dépôt → chaque code (sans chaînage). Utile pour cas ponctuels.
 * @returns {Promise<Record<string, number | null>>} clés en MAJUSCULES
 */
export async function fetchTheoreticalKmMap(originCode, clientCodes) {
  const o = String(originCode ?? '').trim()
  const codes = [...new Set(clientCodes.map((c) => String(c ?? '').trim()).filter(Boolean))]
  if (!o || codes.length === 0) return {}
  const res = await fetch(apiUrl('/api/clients-poi/theoretical-km'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originCode: o, clientCodes: codes }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return {}
  return data.distances && typeof data.distances === 'object' ? data.distances : {}
}

/**
 * Une entrée par ligne : **km total aller-retour** dépôt → ce client → dépôt (comme l’optimiseur).
 * @returns {Promise<(number | null)[]>}
 */
export async function fetchTheoreticalKmLegs(originCode, orderedClientCodes) {
  const o = String(originCode ?? '').trim()
  const clientCodes = Array.isArray(orderedClientCodes)
    ? orderedClientCodes.map((c) => String(c ?? '').trim())
    : []
  if (!o || !clientCodes.some(Boolean)) return clientCodes.map(() => null)
  const res = await fetch(apiUrl('/api/clients-poi/theoretical-km-legs'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originCode: o, clientCodes }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return clientCodes.map(() => null)
  return Array.isArray(data.legKms) ? data.legKms : clientCodes.map(() => null)
}

/** @param {Array<Record<string, unknown>>} rows */
export function applyLegKmsToRows(rows, legKms) {
  return rows.map((r, i) => {
    const km = legKms[i]
    if (km == null || !Number.isFinite(km)) return { ...r, kmTh: '' }
    return { ...r, kmTh: fmtKm(km) }
  })
}

export function applyTheoreticalKmToRows(rows, distanceByCode) {
  return rows.map((r) => {
    const code = String(r.client ?? '').trim().toUpperCase()
    if (!code) return { ...r, kmTh: '' }
    const km = distanceByCode[code]
    if (km == null || !Number.isFinite(km)) return { ...r, kmTh: '' }
    return { ...r, kmTh: fmtKm(km) }
  })
}

export function mergeTheoreticalKmIntoRows(rows, distanceByCode) {
  return rows.map((r) => {
    const code = String(r.client ?? '').trim().toUpperCase()
    if (!code) return r
    const km = distanceByCode[code]
    if (km == null || !Number.isFinite(km)) return r
    return { ...r, kmTh: fmtKm(km) }
  })
}

/** Recalcule toutes les étapes (ligne ajoutée / ordre du tableau). */
export async function fillMissingKmThRows(rows, originCode) {
  const origin = String(originCode ?? '').trim()
  if (!origin) return rows
  const clientCodes = rows.map((r) => String(r.client ?? '').trim())
  if (!clientCodes.some(Boolean)) return rows
  const legKms = await fetchTheoreticalKmLegs(origin, clientCodes)
  return applyLegKmsToRows(rows, legKms)
}
