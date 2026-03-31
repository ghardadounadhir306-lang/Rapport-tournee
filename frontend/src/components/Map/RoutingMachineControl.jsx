import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'

/**
 * Turn-by-turn route between two points (OSRM public demo — dev only).
 * @param {{ from: { lat: number, lng: number }, to: { lat: number, lng: number } } | { waypoints: Array<{lat:number,lng:number}> }} props
 */
export default function RoutingMachineControl({ from, to, waypoints }) {
  const map = useMap()

  useEffect(() => {
    let control = null
    try {
      let wps = []
      if (waypoints?.length >= 2) {
        wps = waypoints.map((p) => L.latLng(p.lat, p.lng))
      } else if (from && to) {
        wps = [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)]
      }
      if (wps.length < 2) return undefined

      control = L.Routing.control({
        waypoints: wps,
        routeWhileDragging: false,
        showAlternatives: false,
        addWaypoints: false,
      }).addTo(map)
    } catch (e) {
      console.warn('Routing machine:', e)
    }
    return () => {
      if (control && map) {
        try {
          map.removeControl(control)
        } catch {
          /* ignore */
        }
      }
    }
  }, [map, from?.lat, from?.lng, to?.lat, to?.lng, waypoints])

  return null
}
