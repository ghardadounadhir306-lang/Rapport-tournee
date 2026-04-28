import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RouteOptimizerMap from '../components/RouteOptimizerMap'
import { splitDepotsAndClients, exportTableToXlsx } from '../utils/routeOptimizer/excel'
import { nearestNeighborOrder } from '../utils/routeOptimizer/nn'
import { fetchDrivingRoute } from '../utils/routeOptimizer/osrm'
import { apiUrl } from '../utils/apiBase'

function fmtDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min ${s} s`
  return `${s} s`
}

function fmtFrKm(n) {
  return n.toFixed(2).replace('.', ',')
}

export default function RouteOptimizerPage({ theme, isEmbedded }) {
  const dk = (d, l) => (theme === 'dark' ? d : l)
  const mapBlockRef = useRef(null)

  const [loadErr, setLoadErr] = useState(null)
  const [loadingFile, setLoadingFile] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState(null)
  const [poiReloadToken, setPoiReloadToken] = useState(0)
  const [allRows, setAllRows] = useState([])
  const { depots, clients } = useMemo(() => splitDepotsAndClients(allRows), [allRows])

  const [depotCode, setDepotCode] = useState('')
  const [selectedCodes, setSelectedCodes] = useState(() => new Set())
  const [search, setSearch] = useState('')

  const [calcLoading, setCalcLoading] = useState(false)
  const [calcErr, setCalcErr] = useState(null)
  const [orderedClients, setOrderedClients] = useState([])
  const [activeDepot, setActiveDepot] = useState(null)
  const [polylineLatLng, setPolylineLatLng] = useState([])
  const [totalKm, setTotalKm] = useState(null)
  const [totalSec, setTotalSec] = useState(null)
  const [tableRows, setTableRows] = useState([])
  const [cumulativeKmByStop, setCumulativeKmByStop] = useState([])
  const [hasCalculatedOnce, setHasCalculatedOnce] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingFile(true)
      setLoadErr(null)
      try {
        const res = await fetch(apiUrl('/api/clients-poi'))
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const msg =
            typeof data?.message === 'string'
              ? data.message
              : Array.isArray(data?.message)
                ? data.message.join(' ')
                : `Erreur ${res.status} — vérifiez que le backend tourne et que la table client_pois existe.`
          throw new Error(msg)
        }
        const items = data.items ?? []
        const rows = items.map((i) => ({
          code: String(i.code ?? '').trim(),
          nom: String(i.nom ?? '').trim(),
          lat: Number(i.lat),
          lng: Number(i.lng),
          isDepot: i.isDepot === true,
        }))
        if (!cancelled) {
          setAllRows(rows)
          const { depots: d } = splitDepotsAndClients(rows)
          if (d.length) setDepotCode(d[0].code)
        }
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : 'Erreur chargement POI')
      } finally {
        if (!cancelled) setLoadingFile(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [poiReloadToken])

  const onImportPoiFile = useCallback(async (file) => {
    if (!file) return
    setImporting(true)
    setImportErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(apiUrl('/api/clients-poi/import'), { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          typeof data?.message === 'string'
            ? data.message
            : Array.isArray(data?.message)
              ? data.message.join(' ')
              : `Import refusé (${res.status})`
        throw new Error(msg)
      }
      setPoiReloadToken((t) => t + 1)
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : 'Import impossible')
    } finally {
      setImporting(false)
    }
  }, [])

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) => c.code.toLowerCase().includes(q) || c.nom.toLowerCase().includes(q),
    )
  }, [clients, search])

  const toggleClient = useCallback((code) => {
    setSelectedCodes((prev) => {
      const n = new Set(prev)
      if (n.has(code)) n.delete(code)
      else n.add(code)
      return n
    })
  }, [])

  const calculer = useCallback(async () => {
    setCalcErr(null)
    const depot = depots.find((d) => d.code === depotCode)
    if (!depot) {
      setCalcErr('Sélectionnez un dépôt.')
      return
    }
    const chosen = clients.filter((c) => selectedCodes.has(c.code))
    if (chosen.length === 0) {
      setCalcErr('Sélectionnez au moins un client.')
      return
    }

    setCalcLoading(true)
    setHasCalculatedOnce(false)
    setOrderedClients([])
    setPolylineLatLng([])
    setTotalKm(null)
    setTotalSec(null)
    setTableRows([])
    setCumulativeKmByStop([])
    setActiveDepot(depot)

    try {
      const ordered = nearestNeighborOrder(depot, chosen)
      const pathPoints = [depot, ...ordered, { ...depot }]
      const route = await fetchDrivingRoute(pathPoints)

      const latLngs = route.geometryLngLat.map(([lng, lat]) => [lat, lng])
      setPolylineLatLng(latLngs)

      const legs = route.legs
      const cum = []
      for (let i = 0; i < ordered.length; i++) {
        let s = 0
        for (let j = 0; j <= i; j++) s += legs[j]?.distance ?? 0
        cum.push(s / 1000)
      }
      setCumulativeKmByStop(cum)

      const kmTotal = route.distanceM / 1000
      setTotalKm(kmTotal)
      setTotalSec(route.durationS)
      setOrderedClients(ordered)
      setHasCalculatedOnce(true)

      const rows = []
      rows.push({
        ordre: '0',
        code: depot.code,
        nom: depot.nom ? `${depot.nom} (départ)` : 'Dépôt (départ)',
        etape: '0,00',
        cumul: '0,00',
      })
      ordered.forEach((c, i) => {
        const stepKm = (legs[i]?.distance ?? 0) / 1000
        const cumKm = cum[i] ?? 0
        rows.push({
          ordre: i + 1,
          code: c.code,
          nom: c.nom,
          etape: fmtFrKm(stepKm),
          cumul: fmtFrKm(cumKm),
        })
      })
      const lastLeg = legs[ordered.length]
      const retourKm = (lastLeg?.distance ?? 0) / 1000
      rows.push({
        ordre: '—',
        code: depot.code,
        nom: 'Dépôt (retour)',
        etape: fmtFrKm(retourKm),
        cumul: fmtFrKm(kmTotal),
      })
      setTableRows(rows)

      setTimeout(() => {
        mapBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (e) {
      setCalcErr(e instanceof Error ? e.message : 'Erreur calcul itinéraire.')
    } finally {
      setCalcLoading(false)
    }
  }, [depots, depotCode, clients, selectedCodes])

  const exportExcel = useCallback(() => {
    if (tableRows.length === 0) return
    exportTableToXlsx(tableRows)
  }, [tableRows])

  const panelStyle = {
    background: dk('#111827', '#ffffff'),
    border: `1px solid ${dk('#374151', '#e5e7eb')}`,
    borderRadius: 12,
    padding: 20,
    boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,.3)' : '0 4px 14px rgba(249,115,22,.12)',
  }
  const labelStyle = { display: 'block', fontWeight: 700, fontSize: 13, color: dk('#e5e7eb', '#374151'), marginTop: 16 }
  const inputStyle = {
    width: '100%',
    marginTop: 6,
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${dk('#4b5563', '#d1d5db')}`,
    background: dk('#1f2937', '#fff'),
    color: dk('#f9fafb', '#111827'),
    fontSize: 14,
  }

  const Wrapper = isEmbedded ? 'div' : 'section'
  const wrapperClass = isEmbedded ? '' : 'content'

  if (loadingFile) {
    return (
      <Wrapper className={wrapperClass} style={isEmbedded ? { marginTop: 20 } : { padding: 24 }}>
        <div style={{ ...panelStyle, textAlign: 'center', color: dk('#9ca3af', '#6b7280') }}>
          Chargement des points client (base de données)…
        </div>
      </Wrapper>
    )
  }

  if (loadErr) {
    return (
      <Wrapper className={wrapperClass} style={isEmbedded ? { marginTop: 20 } : { padding: 24 }}>
        <div style={{ ...panelStyle, borderColor: '#fecaca', background: dk('#450a0a', '#fef2f2'), color: '#b91c1c' }}>
          {loadErr}
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper className={wrapperClass} style={isEmbedded ? { marginTop: 20, paddingTop: 16, borderTop: `1px dashed ${theme === 'dark' ? '#f97316' : '#ea580c'}` } : { padding: '16px 20px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {!isEmbedded && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#f97316' }}>Optimisation de tournée</h2>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: dk('#9ca3af', '#6b7280') }}>
            Ordre automatique (plus proche voisin) · Route OSRM · Données : API{' '}
            <code style={{ fontSize: 12 }}>/api/clients-poi</code>
          </p>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 20,
        }}
        className="route-opt-grid"
      >
        <style>{`
          @media (min-width: 1024px) {
            .route-opt-grid { grid-template-columns: 1fr 2fr !important; align-items: normal; }
          }
        `}</style>

        {/* Colonne gauche ~ 1/3 */}
        <div style={panelStyle}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#f97316', textTransform: 'uppercase' }}>
            Configuration
          </div>
          {allRows.length === 0 && !loadingFile && (
            <p style={{ marginTop: 12, fontSize: 13, color: '#b45309', background: dk('#422006', '#fffbeb'), padding: 10, borderRadius: 8 }}>
              Aucun POI en base. Importez le fichier Excel (même format que{' '}
              <code style={{ fontSize: 11 }}>clients_poi.xlsx</code>) pour remplir la table{' '}
              <code style={{ fontSize: 11 }}>client_pois</code>.
            </p>
          )}
          <label style={{ ...labelStyle, marginTop: 12 }}>Importer / mettre à jour les POI (Excel)</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            disabled={importing}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              onImportPoiFile(f)
            }}
            style={{ ...inputStyle, padding: 8, fontSize: 13 }}
          />
          {importing && (
            <div style={{ marginTop: 8, fontSize: 12, color: dk('#9ca3af', '#6b7280') }}>Import en cours…</div>
          )}
          {importErr && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#b91c1c' }}>{importErr}</div>
          )}
          <label style={labelStyle}>Dépôt de départ</label>
          <select value={depotCode} onChange={(e) => setDepotCode(e.target.value)} style={inputStyle}>
            {depots.map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.nom || 'Entrepôt'}
              </option>
            ))}
          </select>

          <label style={labelStyle}>Clients à visiter</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher code ou nom…"
            style={inputStyle}
          />
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() =>
                setSelectedCodes((prev) => {
                  const n = new Set(prev)
                  filteredClients.forEach((c) => n.add(c.code))
                  return n
                })
              }
              style={{
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                background: dk('#374151', '#f3f4f6'),
                color: dk('#e5e7eb', '#374151'),
                cursor: 'pointer',
              }}
            >
              Tout sélectionner (filtré)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCodes(new Set())}
              style={{
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                background: dk('#374151', '#f3f4f6'),
                color: dk('#e5e7eb', '#374151'),
                cursor: 'pointer',
              }}
            >
              Effacer
            </button>
          </div>
          <div
            style={{
              marginTop: 10,
              maxHeight: 220,
              overflowY: 'auto',
              borderRadius: 8,
              border: `1px solid ${dk('#374151', '#e5e7eb')}`,
              background: dk('#0f172a', '#f9fafb'),
              padding: 8,
            }}
          >
            {filteredClients.map((c) => (
              <label
                key={c.code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: dk('#e5e7eb', '#374151'),
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedCodes.has(c.code)}
                  onChange={() => toggleClient(c.code)}
                />
                <span>
                  <strong style={{ fontFamily: 'monospace' }}>{c.code}</strong> — {c.nom}
                </span>
              </label>
            ))}
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: dk('#9ca3af', '#6b7280') }}>
            {selectedCodes.size} client(s) sélectionné(s)
          </p>

          <button
            type="button"
            onClick={calculer}
            disabled={calcLoading}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '14px 16px',
              fontSize: 15,
              fontWeight: 800,
              border: 'none',
              borderRadius: 10,
              background: calcLoading ? '#9ca3af' : '#f97316',
              color: '#fff',
              cursor: calcLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(249,115,22,.35)',
            }}
          >
            {calcLoading ? 'Calcul en cours…' : 'Calculer la Tournée'}
          </button>
          {calcErr && (
            <p style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#fef2f2', color: '#b91c1c', fontSize: 13 }}>
              {calcErr}
            </p>
          )}
        </div>

        {/* Colonne droite ~ 2/3 : carte */}
        <div ref={mapBlockRef} style={{ ...panelStyle, position: 'relative', padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#f97316', textTransform: 'uppercase' }}>
              Carte
            </span>
            {calcLoading && (
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>OSRM…</span>
            )}
          </div>
          {calcLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 12,
                zIndex: 500,
                borderRadius: 12,
                background: theme === 'dark' ? 'rgba(17,24,39,.92)' : 'rgba(255,255,255,.88)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              <div style={{ width: 40, height: 40, border: '4px solid #fed7aa', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontWeight: 700, color: dk('#e5e7eb', '#374151') }}>Calcul de l&apos;itinéraire…</span>
            </div>
          )}
          {activeDepot && hasCalculatedOnce && orderedClients.length > 0 ? (
            <RouteOptimizerMap
              depot={activeDepot}
              orderedClients={orderedClients}
              polylineLatLng={polylineLatLng}
              cumulativeKmByStop={cumulativeKmByStop}
            />
          ) : (
            <div
              style={{
                height: 'min(520px, 65vh)',
                minHeight: 360,
                borderRadius: 12,
                background: dk('#1f2937', '#f3f4f6'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: dk('#9ca3af', '#6b7280'),
                fontSize: 14,
                textAlign: 'center',
                padding: 24,
              }}
            >
              Sélectionnez des clients puis cliquez sur <strong> Calculer la Tournée </strong> — la carte s&apos;affichera ici.
            </div>
          )}
        </div>
      </div>

      {(hasCalculatedOnce && totalKm != null && totalSec != null) || tableRows.length > 0 ? (
        <div style={{ marginTop: 24 }}>
          {totalKm != null && totalSec != null && (
            <div
              style={{
                ...panelStyle,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: dk('#9ca3af', '#6b7280'), textTransform: 'uppercase' }}>Distance totale</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#ea580c' }}>{totalKm.toFixed(2)} km</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: dk('#9ca3af', '#6b7280'), textTransform: 'uppercase' }}>Durée estimée</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: dk('#f9fafb', '#111827') }}>{fmtDuration(totalSec)}</div>
              </div>
            </div>
          )}

          {tableRows.length > 0 && (
            <div style={panelStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: dk('#f9fafb', '#111827') }}>Détail de l&apos;itinéraire</span>
                <button
                  type="button"
                  onClick={exportExcel}
                  style={{
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 8,
                    border: `1px solid ${dk('#4b5563', '#d1d5db')}`,
                    background: dk('#374151', '#fff'),
                    color: dk('#f9fafb', '#111827'),
                    cursor: 'pointer',
                  }}
                >
                  Exporter Excel
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f97316', color: '#fff' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Code</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Nom Client</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Étape (km)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Cumulé (km)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((r, idx) => (
                      <tr
                        key={`${r.code}-${idx}`}
                        style={{
                          background: idx % 2 === 0 ? dk('#1f2937', '#fff') : dk('#111827', '#fffaf7'),
                          color: dk('#e5e7eb', '#374151'),
                        }}
                      >
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.ordre}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{r.code}</td>
                        <td style={{ padding: '8px 12px' }}>{r.nom}</td>
                        <td style={{ padding: '8px 12px' }}>{r.etape}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{r.cumul}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Wrapper>
  )
}
