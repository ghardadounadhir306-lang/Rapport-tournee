import React, { useCallback, useMemo, useState } from 'react'
import LocationPicker from '../components/Map/LocationPicker'
import { getCurrentPosition } from '../services/locationService'
import { apiUrl } from '../utils/apiBase'

/**
 * Normalize any date-like value to YYYY-MM-DD for <input type="date">.
 * Handles: Date objects, ISO strings, French DD/MM/YYYY, partial timestamps.
 */
function toDateInput(val) {
  if (!val) return ''
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return ''
    return val.toISOString().slice(0, 10)
  }
  const s = String(val).trim()
  // ISO / timestamp: 2024-01-15T... or 2024-01-15
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  // French format: 15/01/2024
  const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`
  return ''
}

export default function TourneePage({
  theme,
  activeTab,
  formData,
  onFormChange,
  tableRows,
  onUpdateRow,
  onDeleteRow,
  onSave,
  selectedTmsId,
  tourneeAlerts = [],
}) {
  const dk = (dark, light) => theme === 'dark' ? dark : light
  const [showGps, setShowGps] = useState(false)

  const gpsStartValue = useMemo(() => {
    const la = parseFloat(formData.gpsStartLat)
    const ln = parseFloat(formData.gpsStartLng)
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null
    return { lat: la, lng: ln, label: formData.gpsStartLabel || '' }
  }, [formData.gpsStartLat, formData.gpsStartLng, formData.gpsStartLabel])

  const gpsEndValue = useMemo(() => {
    const la = parseFloat(formData.gpsEndLat)
    const ln = parseFloat(formData.gpsEndLng)
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null
    return { lat: la, lng: ln, label: formData.gpsEndLabel || '' }
  }, [formData.gpsEndLat, formData.gpsEndLng, formData.gpsEndLabel])

  const setGpsStart = useCallback(
    (v) => {
      if (!v) {
        onFormChange('gpsStartLat', '')
        onFormChange('gpsStartLng', '')
        onFormChange('gpsStartLabel', '')
        return
      }
      onFormChange('gpsStartLat', String(v.lat))
      onFormChange('gpsStartLng', String(v.lng))
      onFormChange('gpsStartLabel', v.label || '')
    },
    [onFormChange],
  )

  const setGpsEnd = useCallback(
    (v) => {
      if (!v) {
        onFormChange('gpsEndLat', '')
        onFormChange('gpsEndLng', '')
        onFormChange('gpsEndLabel', '')
        return
      }
      onFormChange('gpsEndLat', String(v.lat))
      onFormChange('gpsEndLng', String(v.lng))
      onFormChange('gpsEndLabel', v.label || '')
    },
    [onFormChange],
  )

  const sendGpsPoint = useCallback(async () => {
    if (!selectedTmsId) return
    try {
      const p = await getCurrentPosition()
      await fetch(apiUrl('/api/gps/points'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmsFormId: selectedTmsId,
          latitude: p.lat,
          longitude: p.lng,
          accuracyM: p.accuracy,
          recordedAt: new Date().toISOString(),
        }),
      })
      alert('Point GPS envoyé au serveur.')
    } catch (e) {
      alert(e?.message || 'Impossible d’envoyer le point GPS')
    }
  }, [selectedTmsId])

  return (
    <section className={`content ${dk('dark-theme-content', 'light-theme-content')}`} style={{ padding: '20px' }}>

      {tourneeAlerts.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 8,
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 800, color: '#c2410c', marginBottom: 6 }}>Alertes ({tourneeAlerts.length})</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#9a3412' }}>
            {tourneeAlerts.slice(0, 8).map((a, i) => (
              <li key={i}>{a.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Form container ── */}
      <div className={dk('dark-form-container', 'light-form-container')}>

        {/* Row 1 */}
        <div className={dk('dark-form-row', 'light-form-row')}>
          {[
            { label: 'Date',          field: 'date',       type: 'date',  readOnly: activeTab !== 'AZIZA' },
            { label: 'N° WMS',        field: 'wms',        type: 'text',  readOnly: activeTab !== 'AZIZA' },
            { label: 'N° prestation', field: 'prestation', type: 'text',  readOnly: activeTab !== 'AZIZA' },
            { label: 'Camion',        field: 'truck',      type: 'text',  readOnly: activeTab !== 'AZIZA' },
            { label: 'Chauffeur',     field: 'driver',     type: 'text',  readOnly: activeTab !== 'AZIZA' },
          ].map(({ label, field, type, readOnly }) => (
            <div key={field} className={dk('dark-form-group', 'light-form-group')}>
              <label>{label}</label>
              <input
                type={type}
                value={type === 'date' ? toDateInput(formData[field]) : (formData[field] || '')}
                onChange={(e) => onFormChange(field, e.target.value)}
                readOnly={readOnly}
              />
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className={dk('dark-form-row', 'light-form-row')}>
          <div className={dk('dark-form-group', 'light-form-group')}>
            <label>Tournée gén.</label>
            <input type="text" value={formData.dep || ''} onChange={(e) => onFormChange('dep', e.target.value)} readOnly={activeTab !== 'AZIZA'} />
          </div>
          <div className={dk('dark-form-group', 'light-form-group')}>
            <label>KM facture</label>
            <input type="text" value={formData.kmFacture || ''} onChange={(e) => onFormChange('kmFacture', e.target.value)} />
          </div>
          <div className={dk('dark-form-group', 'light-form-group')}>
            <label>Marchandise</label>
            <input type="text" value={formData.marchandise || ''} onChange={(e) => onFormChange('marchandise', e.target.value)} />
          </div>
          <div className={dk('dark-form-group', 'light-form-group')}>
            <label>Conformité</label>
            <select className={dk('dark-select-white', 'light-select-white')} value={formData.conformite || 'Conforme'} onChange={(e) => onFormChange('conformite', e.target.value)}>
              {['Conforme','Non Conforme','Absence BL','Absence cachet et Signature ( Décharge)','Kilométrage erronée','Nombre de palette non conforme','Retard communication dérogation','Retard envoie document','Livraison effectuée','Livraison non effectuée','Autres'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className={dk('dark-form-group', 'light-form-group')}>
            <label>Observation</label>
            <input type="text" value={formData.observation || ''} onChange={(e) => onFormChange('observation', e.target.value)} />
          </div>
        </div>

        {/* Row 3 */}
        <div className={dk('dark-form-row-multi', 'light-form-row-multi')}>
          {[
            { label: 'H.départ',          field: 'hDepart',         type: 'time' },
            { label: 'Km.Départ',         field: 'kmDepart',        type: 'text' },
            { label: 'H.retour',          field: 'hRetour',         type: 'time' },
            { label: 'Km.Retour',         field: 'kmRetour',        type: 'text' },
            { label: 'Km dernier client', field: 'kmDernierClient', type: 'text' },
            { label: 'Km/Moy',            field: 'kmMoy',           type: 'text' },
          ].map(({ label, field, type }) => (
            <div key={field} className={dk('dark-form-group', 'light-form-group')}>
              <label>{label}</label>
              {type === 'time' ? (
                <div className="time-input-group">
                  <input type="time" value={formData[field] || ''} onChange={(e) => onFormChange(field, e.target.value)} />
                </div>
              ) : (
                <input type="text" value={formData[field] || ''} onChange={(e) => onFormChange(field, e.target.value)} />
              )}
            </div>
          ))}
        </div>

        {/* Row 4 */}
        <div className={`${dk('dark-form-row', 'light-form-row')} align-end`}>
          <div className={dk('dark-form-group', 'light-form-group')} style={{ maxWidth: '250px' }}>
            <label>Total palette</label>
            <input
              type="text"
              value={formData.totalPalettes || '0'}
              onChange={(e) => onFormChange('totalPalettes', e.target.value)}
              style={{ textAlign: 'center' }}
            />
          </div>
        </div>

        {/* GPS départ / arrivée */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800, color: '#f97316' }}>Localisation (carte)</div>
            <button
              type="button"
              onClick={() => setShowGps(v => !v)}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                background: theme === 'dark' ? '#111827' : '#f3f4f6',
                color: theme === 'dark' ? '#e5e7eb' : '#111827',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {showGps ? 'Masquer la carte' : 'Afficher la carte'}
            </button>
          </div>

          {showGps && (
            <>
              <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <LocationPicker label="Départ" value={gpsStartValue} onChange={setGpsStart} height="200px" />
                <LocationPicker label="Arrivée" value={gpsEndValue} onChange={setGpsEnd} height="200px" />
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={sendGpsPoint}
                  disabled={!selectedTmsId}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: '#0ea5e9',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 700,
                    cursor: selectedTmsId ? 'pointer' : 'not-allowed',
                  }}
                >
                  Envoyer position GPS (trace)
                </button>
                <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>
                  Enregistre un point dans la trace serveur (minimum 3 points pour validation alerte « sans GPS »).
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Client table ── */}
      <div className={`${dk('dark-table-container', 'light-table-container')} mt-4`}>
        <table className={dk('dark-themed-table', 'light-themed-table')}>
          <thead>
            <tr>
              {['Client','Dep','UM','Pal','Arrivée.Client','Départ.Client','Km.Arv.Client','Taxe','Livrée','Km TH','Region',''].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr><td colSpan="12" className="empty-message">Aucun client</td></tr>
            ) : (
              tableRows.map((row, index) => (
                <tr key={row.id}>
                  <td style={{ padding: '4px' }}><input type="text"  value={row.client} onChange={(e) => onUpdateRow(index, 'client', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} placeholder="..." /></td>
                  <td style={{ padding: '4px' }}><input type="text"  value={row.dep}    onChange={(e) => onUpdateRow(index, 'dep',    e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="text"  value={row.um}     onChange={(e) => onUpdateRow(index, 'um',     e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="text"  value={row.pal}    onChange={(e) => onUpdateRow(index, 'pal',    e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="time"  value={row.arrivee}onChange={(e) => onUpdateRow(index, 'arrivee',e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="time"  value={row.depart} onChange={(e) => onUpdateRow(index, 'depart', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="text"  value={row.kmArv}  onChange={(e) => onUpdateRow(index, 'kmArv',  e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="text"  value={row.taxe}   onChange={(e) => onUpdateRow(index, 'taxe',   e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>
                  <td style={{ padding: '4px', textAlign: 'center' }}><input type="checkbox" checked={row.livree} onChange={(e) => onUpdateRow(index, 'livree', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#f97316', cursor: 'pointer' }} /></td>
                  <td style={{ padding: '4px' }}><input type="text"  value={row.kmTh}   onChange={(e) => onUpdateRow(index, 'kmTh',   e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>
                  <td style={{ padding: '4px' }}><input type="text"  value={row.region} onChange={(e) => onUpdateRow(index, 'region', e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }} /></td>

                  {/* ── DELETE button ── */}
                  <td style={{ padding: '4px', textAlign: 'center' }}>
                    <button
                      onClick={() => onDeleteRow(index)}
                      title="Supprimer cette ligne"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: '16px',
                        lineHeight: 1,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '16px' }}>
        <button className={dk('dark-save-btn', 'light-save-btn')} onClick={onSave}>
          Enregistrer
        </button>
      </div>
    </section>
  )
}