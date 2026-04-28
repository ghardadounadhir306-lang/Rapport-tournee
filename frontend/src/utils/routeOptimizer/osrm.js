import { OSRM_ROUTE_BASE } from './constants'

export async function fetchDrivingRoute(points) {
  if (points.length < 2) {
    throw new Error('Au moins deux points sont nécessaires.')
  }
  const coordPath = points.map((p) => `${p.lng},${p.lat}`).join(';')
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'false',
  })
  const url = `${OSRM_ROUTE_BASE}/${coordPath}?${params.toString()}`

  const ctrl = new AbortController()
  const timeoutId = window.setTimeout(() => ctrl.abort(), 90_000)
  let res
  try {
    res = await fetch(url, { method: 'GET', signal: ctrl.signal })
  } catch {
    throw new Error(
      'Impossible de joindre le service OSRM. Vérifiez votre connexion internet.',
    )
  } finally {
    window.clearTimeout(timeoutId)
  }

  if (!res.ok) {
    throw new Error(`Erreur OSRM (${res.status}). Réessayez plus tard.`)
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error('Réponse OSRM illisible.')
  }

  if (data?.code !== 'Ok' || !data?.routes?.[0]) {
    throw new Error(data?.message || 'Réponse OSRM invalide.')
  }

  const route = data.routes[0]
  const coords = route.geometry?.coordinates
  if (!coords?.length) {
    throw new Error('Géométrie de route manquante.')
  }

  return {
    distanceM: route.distance,
    durationS: route.duration,
    geometryLngLat: coords,
    legs: (route.legs || []).map((l) => ({
      distance: l.distance,
      duration: l.duration,
    })),
  }
}
