import { useEffect } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import MarkerLayer from './MarkerLayer'
import RouteLayer from './RouteLayer'
import RoutingMachineControl from './RoutingMachineControl'
import { fixLeafletDefaultIcons } from './leafletIconFix'

const DEFAULT_CENTER = [46.603354, 1.888334] // France
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'

/**
 * @param {{
 *   center?: [number, number],
 *   zoom?: number,
 *   height?: string,
 *   markers?: Array<{ lat: number, lng: number, label?: string, key?: string }>,
 *   routePositions?: Array<[number, number] | { lat: number, lng: number }>,
 *   routingFrom?: { lat: number, lng: number },
 *   routingTo?: { lat: number, lng: number },
 *   showUserAccuracy?: number | null,
 *   children?: import('react').ReactNode,
 * }} props
 */
export default function MapComponent({
  center = DEFAULT_CENTER,
  zoom = 6,
  height = '320px',
  markers = [],
  routePositions = [],
  routingFrom = null,
  routingTo = null,
  showUserAccuracy = null,
  children = null,
}) {
  useEffect(() => {
    fixLeafletDefaultIcons()
  }, [])

  const c = Array.isArray(center) && center.length === 2 ? center : DEFAULT_CENTER

  return (
    <MapContainer
      center={c}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '8px', zIndex: 0 }}
      scrollWheelZoom
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <RouteLayer positions={routePositions} />
      {routingFrom && routingTo && (
        <RoutingMachineControl from={routingFrom} to={routingTo} />
      )}
      <MarkerLayer markers={markers} showAccuracy={showUserAccuracy} />
      {children}
    </MapContainer>
  )
}
