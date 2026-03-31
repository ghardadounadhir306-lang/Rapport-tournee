import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../utils/apiBase'
import MapComponent from '../components/Map/MapComponent'
import LocationPicker from '../components/Map/LocationPicker'
import { getCurrentPosition, watchPosition } from '../services/locationService'

/**
 * Live GPS + route replay for selected TMS id.
 */
export default function GpsPage({ selectedTmsId, theme }) {
  const dk = (d, l) => (theme === 'dark' ? d : l)
  const [pos, setPos] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [geoErr, setGeoErr] = useState('')
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [placeA, setPlaceA] = useState(null)
  const [placeB, setPlaceB] = useState(null)
  const [routeKm, setRouteKm] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeErr, setRouteErr] = useState('')

  const distanceKm = useMemo(() => {
    if (!placeA || !placeB) return null
    const { lat: lat1, lng: lon1 } = placeA
    const { lat: lat2, lng: lon2 } = placeB
    if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null

    const R = 6371 // km
    const toRad = (d) => (d * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }, [placeA, placeB])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setRouteErr('')
      setRouteKm(null)
      if (!placeA || !placeB) return
      if (![placeA.lat, placeA.lng, placeB.lat, placeB.lng].every(Number.isFinite)) return

      setRouteLoading(true)
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${placeA.lng},${placeA.lat};${placeB.lng},${placeB.lat}` +
          `?overview=false&alternatives=false&steps=false`
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        const data = await res.json()
        const meters = data?.routes?.[0]?.distance
        if (!Number.isFinite(meters)) throw new Error('No route distance')
        if (!cancelled) setRouteKm(meters / 1000)
      } catch (e) {
        if (!cancelled) setRouteErr(e?.message || 'Erreur calcul distance route')
      } finally {
        if (!cancelled) setRouteLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [placeA, placeB])

  const loadTrace = useCallback(async () => {
    if (!selectedTmsId) {
      setPoints([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(apiUrl(`/api/gps/tournee/${encodeURIComponent(selectedTmsId)}`))
      if (!res.ok) throw new Error(String(res.status))
      const data = await res.json()
      setPoints(Array.isArray(data.points) ? data.points : [])
    } catch {
      setPoints([])
    } finally {
      setLoading(false)
    }
  }, [selectedTmsId])

  useEffect(() => {
    loadTrace()
  }, [loadTrace])

  useEffect(() => {
    const stop = watchPosition(
      (p) => {
        setPos(p)
        setAccuracy(p.accuracy)
        setGeoErr('')
      },
      (e) => setGeoErr(e?.message || 'GPS indisponible'),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    )
    return stop
  }, [])

  const routePositions = points.map((p) => [Number(p.latitude), Number(p.longitude)]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))

  const markers = []
  if (pos) {
    markers.push({ lat: pos.lat, lng: pos.lng, label: 'Position actuelle', key: 'me' })
  }
  if (placeA && Number.isFinite(placeA.lat) && Number.isFinite(placeA.lng)) {
    markers.push({ lat: placeA.lat, lng: placeA.lng, label: placeA.label ? `A — ${placeA.label}` : 'A', key: 'A' })
  }
  if (placeB && Number.isFinite(placeB.lat) && Number.isFinite(placeB.lng)) {
    markers.push({ lat: placeB.lat, lng: placeB.lng, label: placeB.label ? `B — ${placeB.label}` : 'B', key: 'B' })
  }
  if (routePositions.length) {
    const [la, ln] = routePositions[0]
    markers.push({ lat: la, lng: ln, label: 'Début trace', key: 'start' })
    if (routePositions.length > 1) {
      const end = routePositions[routePositions.length - 1]
      markers.push({ lat: end[0], lng: end[1], label: 'Fin trace', key: 'end' })
    }
  }

  const center = pos
    ? [pos.lat, pos.lng]
    : routePositions[0] || [46.603354, 1.888334]

  return (
    <section className={`content ${dk('dark-theme-content', 'light-theme-content')}`} style={{ padding: 20 }}>
      <div className={dk('dark-form-container', 'light-form-container')} style={{ marginBottom: 16 }}>
        <h2 className="title-orange" style={{ marginTop: 0 }}>GPS &amp; carte</h2>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>
          Suivi en direct et trace enregistrée pour la tournée sélectionnée ({selectedTmsId || 'aucune'}).
        </p>
        {geoErr ? <div style={{ color: '#dc2626', fontSize: 13 }}>{geoErr}</div> : null}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <button
            type="button"
            onClick={() => getCurrentPosition().then((p) => { setPos(p); setAccuracy(p.accuracy) }).catch((e) => setGeoErr(e.message))}
            style={{ padding: '8px 14px', borderRadius: 8, background: '#f97316', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Rafraîchir position
          </button>
          <button
            type="button"
            onClick={loadTrace}
            disabled={loading || !selectedTmsId}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}
          >
            {loading ? 'Chargement…' : 'Recharger trace'}
          </button>
        </div>
      </div>

      <MapComponent
        center={center}
        zoom={pos || routePositions.length ? 13 : 6}
        height="420px"
        markers={markers}
        routePositions={routePositions}
        showUserAccuracy={accuracy}
      />

      <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
        Points trace: {points.length} — Les points sont envoyés au serveur via l&apos;API GPS (batch) depuis la fiche tournée.
      </div>

      <div className={dk('dark-form-container', 'light-form-container')} style={{ marginTop: 16 }}>
        <h3 className="title-orange" style={{ marginTop: 0 }}>Distance entre 2 lieux</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
          Choisis deux adresses (A و B) وراح نعطيك المسافة بالكيلومتر (par route). كاين زادة المسافة الهوائية (à vol d&apos;oiseau) للمقارنة.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <LocationPicker label="Lieu A" value={placeA} onChange={setPlaceA} height="200px" />
          <LocationPicker label="Lieu B" value={placeB} onChange={setPlaceB} height="200px" />
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>
            <div>
              Distance (route):{' '}
              <span style={{ color: '#f97316' }}>
                {routeLoading ? 'Calcul…' : routeKm == null ? '—' : `${routeKm.toFixed(2)} km`}
              </span>
            </div>
            <div style={{ marginTop: 2, fontSize: 12, fontWeight: 700, color: '#64748b' }}>
              Distance (air): {distanceKm == null ? '—' : `${distanceKm.toFixed(2)} km`}
            </div>
            {routeErr ? <div style={{ marginTop: 6, color: '#dc2626', fontSize: 12 }}>{routeErr}</div> : null}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => { setPlaceA(placeB); setPlaceB(placeA) }}
              disabled={!placeA && !placeB}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}
            >
              Inverser A ↔ B
            </button>
            <button
              type="button"
              onClick={() => { setPlaceA(null); setPlaceB(null) }}
              disabled={!placeA && !placeB}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }}
            >
              Effacer
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
