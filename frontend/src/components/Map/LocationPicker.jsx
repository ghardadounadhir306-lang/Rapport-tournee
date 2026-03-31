import { useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { geocodeAddress, reverseGeocode } from '../../utils/geocoding'
import { fixLeafletDefaultIcons } from './leafletIconFix'
import { useEffect } from 'react'

function FlyTo({ center, zoom = 14 }) {
  const map = useMap()
  useEffect(() => {
    if (center?.[0] != null && center?.[1] != null) {
      map.setView(center, zoom)
    }
  }, [map, center, zoom])
  return null
}

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e)
    },
  })
  return null
}

/**
 * Address search + map pin; calls onChange({ lat, lng, label }) when location is set.
 */
export default function LocationPicker({
  value = null,
  onChange,
  height = '220px',
  label = 'Adresse',
}) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const pos = value && Number.isFinite(value.lat) && Number.isFinite(value.lng) ? [value.lat, value.lng] : [46.603354, 1.888334]

  useEffect(() => {
    fixLeafletDefaultIcons()
  }, [])

  const search = useCallback(async () => {
    setErr('')
    setLoading(true)
    try {
      const results = await geocodeAddress(query)
      if (!results.length) {
        setErr('Aucun résultat')
        return
      }
      const r = results[0]
      onChange?.({ lat: r.lat, lng: r.lng, label: r.displayName })
    } catch (e) {
      setErr(e?.message || 'Erreur recherche')
    } finally {
      setLoading(false)
    }
  }, [query, onChange])

  const onMapClick = useCallback(
    async (e) => {
      const { lat, lng } = e.latlng
      setLoading(true)
      setErr('')
      try {
        const rev = await reverseGeocode(lat, lng)
        onChange?.({ lat, lng, label: rev?.displayName ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
      } catch {
        onChange?.({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` })
      } finally {
        setLoading(false)
      }
    },
    [onChange],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, fontSize: 12 }}>{label}</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une adresse…"
          style={{ flex: 1, minWidth: 200, padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb' }}
          onKeyDown={(e) => e.key === 'Enter' && search()}
        />
        <button type="button" onClick={search} disabled={loading} style={{ padding: '8px 14px', borderRadius: 6, background: '#f97316', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? '…' : 'Chercher'}
        </button>
      </div>
      {err ? <div style={{ color: '#dc2626', fontSize: 12 }}>{err}</div> : null}
      {value?.label && (
        <div style={{ fontSize: 11, color: '#64748b' }}>{value.label}</div>
      )}
      <MapContainer
        center={pos}
        zoom={value ? 14 : 6}
        style={{ height, width: '100%', borderRadius: 8, zIndex: 0 }}
        scrollWheelZoom
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        <MapClickHandler onClick={onMapClick} />
        <FlyTo center={pos} zoom={14} />
        {value && Number.isFinite(value.lat) && Number.isFinite(value.lng) && (
          <Marker position={[value.lat, value.lng]} />
        )}
      </MapContainer>
      <div style={{ fontSize: 10, color: '#94a3b8' }}>Cliquez sur la carte pour placer le repère (géocodage inverse).</div>
    </div>
  )
}
