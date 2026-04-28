import { haversineKm } from './geo'

export function nearestNeighborOrder(depot, clients) {
  if (clients.length === 0) return []
  const remaining = [...clients]
  const ordered = []
  let curLat = depot.lat
  let curLng = depot.lng

  while (remaining.length > 0) {
    let bestI = 0
    let bestD = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(curLat, curLng, remaining[i].lat, remaining[i].lng)
      if (d < bestD) {
        bestD = d
        bestI = i
      }
    }
    const [next] = remaining.splice(bestI, 1)
    ordered.push(next)
    curLat = next.lat
    curLng = next.lng
  }
  return ordered
}
