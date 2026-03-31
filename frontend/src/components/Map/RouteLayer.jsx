import { Polyline } from 'react-leaflet'

/**
 * Static route as polyline (GPS trace or waypoints).
 * @param {{ positions: Array<[number, number]>|Array<{lat:number,lng:number}>, color?: string }} props
 */
export default function RouteLayer({ positions = [], color = '#f97316' }) {
  const latlngs = positions
    .map((p) => (Array.isArray(p) ? p : [p.lat, p.lng]))
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))

  if (latlngs.length < 2) return null

  return (
    <Polyline
      positions={latlngs}
      pathOptions={{ color, weight: 4, opacity: 0.85 }}
    />
  )
}
