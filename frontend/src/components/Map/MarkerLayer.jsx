import { Marker, Popup, Circle } from 'react-leaflet'

/**
 * @param {{ markers: Array<{ lat: number, lng: number, label?: string, key?: string }>, showAccuracy?: number|null }} props
 */
export default function MarkerLayer({ markers = [], showAccuracy = null }) {
  return (
    <>
      {markers.map((m, i) => {
        const k = m.key ?? `m-${i}`
        return (
          <Marker key={k} position={[m.lat, m.lng]}>
            {m.label ? <Popup>{m.label}</Popup> : null}
          </Marker>
        )
      })}
      {typeof showAccuracy === 'number' && showAccuracy > 0 && markers[0] && (
        <Circle
          center={[markers[0].lat, markers[0].lng]}
          radius={showAccuracy}
          pathOptions={{ color: '#3b82f6', fillColor: '#93c5fd', fillOpacity: 0.2 }}
        />
      )}
    </>
  )
}
