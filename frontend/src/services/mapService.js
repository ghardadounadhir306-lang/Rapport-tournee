/**
 * Optional Overpass API helpers for POI / places near a point.
 */

const OVERPASS = 'https://overpass-api.de/api/interpreter'

/**
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusM
 * @returns {Promise<object[]>}
 */
export async function queryAmenitiesNear(lat, lng, radiusM = 500) {
  const la = Number(lat)
  const ln = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return []

  const q = `
    [out:json][timeout:25];
    (
      node["amenity"](around:${radiusM},${la},${ln});
      way["amenity"](around:${radiusM},${la},${ln});
    );
    out body;
  `
  const res = await fetch(OVERPASS, {
    method: 'POST',
    body: `data=${encodeURIComponent(q)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok) throw new Error(`Overpass ${res.status}`)
  const data = await res.json()
  return data?.elements ?? []
}
