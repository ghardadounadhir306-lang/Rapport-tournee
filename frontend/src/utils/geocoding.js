/**
 * Nominatim (OpenStreetMap) geocoding with localStorage cache (24h TTL).
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const CACHE_PREFIX = 'rtournee_nominatim_'
const TTL_MS = 24 * 60 * 60 * 1000

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { t, v } = JSON.parse(raw)
    if (Date.now() - t > TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return v
  } catch {
    return null
  }
}

function cacheSet(key, value) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v: value }))
  } catch {
    /* ignore quota */
  }
}

const inflight = new Map()

/**
 * @param {string} address
 * @returns {Promise<{ lat: number, lng: number, displayName: string }[]>}
 */
export async function geocodeAddress(address) {
  const q = String(address || '').trim()
  if (!q) return []

  const ck = 'fwd:' + q.toLowerCase()
  const cached = cacheGet(ck)
  if (cached) return cached

  if (inflight.has(ck)) return inflight.get(ck)

  const p = (async () => {
    const url = `${NOMINATIM}/search?format=json&limit=5&q=${encodeURIComponent(q)}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'Accept-Language': 'fr' },
    })
    if (!res.ok) throw new Error(`Nominatim ${res.status}`)
    const data = await res.json()
    const out = (Array.isArray(data) ? data : []).map((x) => ({
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon),
      displayName: x.display_name || '',
    }))
    cacheSet(ck, out)
    return out
  })()

  inflight.set(ck, p)
  try {
    return await p
  } finally {
    inflight.delete(ck)
  }
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ displayName: string, address: object }|null>}
 */
export async function reverseGeocode(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null

  const ck = `rev:${la.toFixed(5)},${ln.toFixed(5)}`
  const cached = cacheGet(ck)
  if (cached) return cached

  if (inflight.has(ck)) return inflight.get(ck)

  const p = (async () => {
    const url = `${NOMINATIM}/reverse?format=json&lat=${la}&lon=${ln}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'Accept-Language': 'fr' },
    })
    if (!res.ok) throw new Error(`Nominatim ${res.status}`)
    const data = await res.json()
    const out = data?.display_name
      ? { displayName: data.display_name, address: data.address || {} }
      : null
    if (out) cacheSet(ck, out)
    return out
  })()

  inflight.set(ck, p)
  try {
    return await p
  } finally {
    inflight.delete(ck)
  }
}
