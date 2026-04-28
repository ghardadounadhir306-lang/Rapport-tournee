import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const warehouseIcon = L.divIcon({
  className: '',
  html: `<div style="background:#dc2626;width:44px;height:44px;border-radius:10px;border:3px solid #fff;box-shadow:0 3px 10px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:22px;">🏭</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

function clientIcon(n) {
  return L.divIcon({
    className: '',
    html: `<div style="background:#2563eb;color:#fff;min-width:30px;height:30px;padding:0 8px;border-radius:9999px;border:3px solid #fff;font-weight:800;font-size:13px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);">${n}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

function FitBounds({ latLngs }) {
  const map = useMap()
  useEffect(() => {
    if (!latLngs?.length) return
    const b = L.latLngBounds(latLngs)
    map.fitBounds(b, { padding: [48, 48], maxZoom: 14 })
  }, [map, latLngs])
  return null
}

export default function RouteOptimizerMap({ depot, orderedClients, polylineLatLng, cumulativeKmByStop }) {
  const center = useMemo(() => [depot.lat, depot.lng], [depot.lat, depot.lng])

  const boundsPoints = useMemo(() => {
    if (polylineLatLng?.length > 1) return polylineLatLng
    const pts = [[depot.lat, depot.lng]]
    orderedClients.forEach((c) => pts.push([c.lat, c.lng]))
    return pts
  }, [depot, orderedClients, polylineLatLng])

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: 'min(520px, 65vh)', minHeight: 360, width: '100%', borderRadius: 12, zIndex: 0 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds latLngs={boundsPoints} />
      {polylineLatLng?.length > 1 && (
        <Polyline positions={polylineLatLng} pathOptions={{ color: '#1d4ed8', weight: 5, opacity: 0.88 }} />
      )}
      <Marker position={[depot.lat, depot.lng]} icon={warehouseIcon}>
        <Popup>
          <div style={{ fontWeight: 700 }}>Dépôt — {depot.code}</div>
          <div style={{ fontSize: 12 }}>{depot.nom || 'Entrepôt'}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Cumul : 0,00 km</div>
        </Popup>
      </Marker>
      {orderedClients.map((c, i) => {
        const cum = cumulativeKmByStop[i] ?? 0
        return (
          <Marker key={`${c.code}-${i}`} position={[c.lat, c.lng]} icon={clientIcon(i + 1)}>
            <Popup>
              <div style={{ fontWeight: 700 }}>
                Arrêt {i + 1} — {c.code}
              </div>
              <div style={{ fontSize: 12 }}>{c.nom}</div>
              <div style={{ fontSize: 12, marginTop: 4, color: '#1d4ed8', fontWeight: 600 }}>
                Cumul depuis dépôt : {cum.toFixed(2)} km
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
