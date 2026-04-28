import React, { useCallback, useMemo, useState } from 'react'
import LocationPicker from '../components/Map/LocationPicker'
import RouteOptimizerPage from './RouteOptimizerPage'
import { getCurrentPosition } from '../services/locationService'
import { apiUrl } from '../utils/apiBase'
import { useCalculateTarif } from '../hooks/useCalculateTarif'

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

function formatMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0,00 DT'
  return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`
}

export default function TourneePage({
  theme,
  activeTab,
  formData,
  onFormChange,
  tableRows,
  clientNameByCode = {},
  onUpdateRow,
  onDeleteRow,
  onSave,
  selectedTmsId,
  tourneeAlerts = [],
  detailEnriching = false,
}) {
  const dk = (dark, light) => theme === 'dark' ? dark : light
  const [showOptimizer, setShowOptimizer] = useState(false)
  const tableRef = React.useRef(null)

  // Scroll table into view after a short delay (let React render first)
  const scrollTableIntoView = React.useCallback(() => {
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }, [])

  // Simulation Tarif
  const { calculate, result: simResult, error: simError, loading: simLoading, setResult: setSimResult, setError: setSimError } = useCalculateTarif()

  const handleSimulateMenu = async () => {
    setSimError('')
    setSimResult(null)

    let nature = 'Sec'
    if (activeTab === 'FLEG') {
      nature = 'Fleg'
    } else if (activeTab === 'DIVERS') {
      nature = 'Divers'
    } else {
      // Pour AZIZA, on se base sur la marchandise, sinon 'Sec' par défaut
      const m = String(formData.marchandise || '').trim().toLowerCase()
      if (m.includes('frais') || m.includes('froid') || m.includes('surgel')) {
        nature = 'Froid'
      } else {
        nature = 'Sec' // default
      }
    }
    
    // Déterminer le KM: d'abord le KM facturé, sinon la somme des KMs théoriques des clients
    let km = parseFloat(String(formData.kmFacture).replace(',', '.')) || 0
    if (km <= 0) {
      km = tableRows.reduce((sum, r) => sum + (parseFloat(String(r.kmTh).replace(',', '.')) || 0), 0)
    }

    // Déterminer les palettes: d'abord le champ global, sinon la somme des palettes clients
    let palettes = parseFloat(String(formData.totalPalettes).replace(',', '.')) || 0
    if (palettes <= 0) {
      palettes = tableRows.reduce((sum, r) => sum + (parseFloat(String(r.pal).replace(',', '.')) || 0), 0)
    }
    palettes = Math.min(palettes, 22)

    if (tableRows.length === 0) {
      setSimError("Le calcul nécessite un ou plusieurs magasins/clients dans le tableau.")
      return
    }

    if (km <= 0) {
      setSimError("Le calcul nécessite une distance (KM). Veuillez renseigner le 'KM facture' ou les 'Km TH' des clients.")
      return
    }
    if (palettes <= 0) {
      setSimError("Le calcul nécessite un nombre de palettes. Veuillez renseigner le 'Total palette' ou le 'Pal' des clients.")
      return
    }

    const payload = {
      km: km,
      palettes: palettes,
      nbMagasins: tableRows.length,
      nature: nature,
      tourneeType: formData.dep === 'Générique' ? 'Generique' : 'Non Generique',
      deliveryTime: '00:00', // Can be refined if needed
      stores: tableRows.map((r, i) => ({
        name: clientDisplayName(r.client) || `Magasin ${i + 1}`,
        palettes: parseFloat(String(r.pal).replace(',', '.')) || 0,
        time: r.arrivee || '00:00'
      }))
    }

    // fallback mapping based on specific needs can go here
    if (tableRows.length > 0 && tableRows[0].arrivee) {
      payload.deliveryTime = tableRows[0].arrivee
    }

    if (nature === 'Fleg') {
      payload.vehicleType = 'Camion' // fallback
      payload.zone = 'Tunis'        // fallback
    }

    await calculate(payload)
    // After calculation, scroll table back into view
    scrollTableIntoView()
  }

  // Fields auto-filled from mobile app (transport_data fallback)
  const autoFilled = useMemo(() => {
    const list = formData.autoFilledFromMobile
    return Array.isArray(list) ? new Set(list) : new Set()
  }, [formData.autoFilledFromMobile])

  const AutoBadge = ({ field }) => {
    if (!autoFilled.has(field)) return null
    return (
      <span
        title="Auto-rempli depuis l'app mobile"
        style={{
          fontSize: '8px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
          color: '#fff',
          padding: '1px 5px',
          borderRadius: '3px',
          letterSpacing: '0.03em',
          marginLeft: '4px',
          whiteSpace: 'nowrap',
        }}
      >📱 AUTO</span>
    )
  }

  const clientDisplayName = useCallback((code) => {
    const key = String(code ?? '').trim().toUpperCase()
    if (!key) return ''
    return clientNameByCode[key] || String(code)
  }, [clientNameByCode])

  // Auto-calculate KM Facture = KM Dernier Client − KM Départ
  React.useEffect(() => {
    const depart   = parseFloat(String(formData.kmDepart        ?? '').replace(',', '.'))
    const dernier  = parseFloat(String(formData.kmDernierClient ?? '').replace(',', '.'))
    if (Number.isFinite(depart) && Number.isFinite(dernier)) {
      const result = Math.round((dernier - depart) * 100) / 100
      onFormChange('kmFacture', result >= 0 ? String(result) : '')
    }
  }, [formData.kmDepart, formData.kmDernierClient])



  // Removed GPS handlers

  // Table container dynamic sizing: if more than 4 rows, enable internal scroll
  // Always give the table a min-height so it stays visible even when panels open below
  const tableContainerStyle = tableRows && tableRows.length > 4
    ? { maxHeight: '260px', minHeight: '80px', overflow: 'auto' }
    : { minHeight: '80px' }

  return (
    <section className={`content ${dk('dark-theme-content', 'light-theme-content')}`} style={{ padding: '20px', minHeight: 0 }}>

      {/* ── Background enrichment banner ── */}
      {detailEnriching && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: theme === 'dark' ? 'rgba(249,115,22,0.12)' : '#fff7ed',
            border: '1px solid #fed7aa',
            fontSize: '12px',
            fontWeight: 600,
            color: '#c2410c',
            animation: 'tourneePulse 1.4s ease-in-out infinite',
          }}
        >
          <style>{`
            @keyframes tourneePulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.55; }
            }
          `}</style>
          <span style={{ fontSize: '16px' }}>🔄</span>
          Mise à jour des détails en arrière-plan…
        </div>
      )}

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
          {activeTab === 'AZIZA' && (
            <div className={dk('dark-form-group', 'light-form-group')}>
              <label>Tournée gén.</label>
              <select className={dk('dark-select-white', 'light-select-white')} value={formData.dep || ''} onChange={(e) => onFormChange('dep', e.target.value)}>
                <option value=""></option>
                <option value="Générique">Générique</option>
                <option value="Non générique">Non générique</option>
              </select>
            </div>
          )}
          <div className={dk('dark-form-group', 'light-form-group')}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              KM facture
              <span style={{ fontSize: '9px', fontWeight: 700, background: '#f97316', color: '#fff', padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.03em' }}>AUTO</span>
            </label>
            <input
              type="text"
              value={formData.kmFacture || ''}
              readOnly
              style={{ cursor: 'default', background: theme === 'dark' ? '#1a1d21' : '#f1f5f9', fontWeight: 700, color: '#f97316' }}
              title="Calculé automatiquement : KM Dernier Client − KM Départ"
            />
          </div>
          <div className={dk('dark-form-group', 'light-form-group')}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>Marchandise<AutoBadge field="marchandise" /></label>
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
              <label style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>{label}<AutoBadge field={field} /></label>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>Total palette<AutoBadge field="totalPalettes" /></label>
            <input
              type="text"
              value={formData.totalPalettes || '0'}
              onChange={(e) => onFormChange('totalPalettes', e.target.value)}
              style={{ textAlign: 'center' }}
            />
          </div>
        </div>
      </div>

      {/* ── Client table ── */}
      <div className={`${dk('dark-table-container', 'light-table-container')} mt-4`} style={tableContainerStyle}>
        <table className={dk('dark-themed-table', 'light-themed-table')}>
          <thead>
            <tr>
              {['Client','Dep','UM','Pal','Arrivée.Client','Départ.Client','Km.Arv.Client','Taxe','Livrée','Km TH','Region',''].map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr><td colSpan="12" className="empty-message">Aucun client</td></tr>
            ) : (
              tableRows.map((row, index) => (
                <tr key={`${row && row.id ? `r-${row.id}` : 'r'}-${index}`}>
                  <td style={{ padding: '4px' }}>
                    <input
                      type="text"
                      value={clientDisplayName(row.client)}
                      readOnly
                      title={row.client ? `Code client: ${row.client}` : ''}
                      style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'inherit', fontSize: '13px' }}
                      placeholder="..."
                    />
                  </td>
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

        {/* ── Route Optimizer (Embedded) ── */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800, color: '#f97316' }}>Optimisation de tournée</div>
            <button
              type="button"
              onClick={() => {
                setShowOptimizer(v => !v)
                // Keep table in view when panel expands
                scrollTableIntoView()
              }}
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
              {showOptimizer ? 'Masquer l\'optimisation' : 'Afficher l\'optimisation'}
            </button>
          </div>
          {showOptimizer && <RouteOptimizerPage theme={theme} isEmbedded />}
        </div>

      {/* ── Simulation Tarif ── */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${dk('#374151', '#e5e7eb')}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ fontWeight: 800, color: '#2563eb' }}>Calcul du Tarif (Simulation)</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {simResult && (
              <button
                type="button"
                onClick={() => {
                  setSimResult(null)
                  setSimError('')
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: dk('#374151', '#e2e8f0'),
                  color: dk('#e5e7eb', '#475569'),
                  border: `1px solid ${dk('#4b5563', '#cbd5e1')}`,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Masquer
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                handleSimulateMenu()
                // Keep table in view while result loads below
                scrollTableIntoView()
              }}
              disabled={simLoading}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                background: dk('#111827', '#eff6ff'),
                color: dk('#e5e7eb', '#1d4ed8'),
                border: `1px solid ${dk('#374151', '#bfdbfe')}`,
                fontWeight: 800,
                cursor: simLoading ? 'wait' : 'pointer',
                opacity: simLoading ? 0.7 : 1
              }}
            >
              {simLoading ? '⏳ Calcul...' : (simResult ? 'Recalculer' : 'Afficher tarif')}
            </button>
          </div>
        </div>

        {simError && (
          <div style={{ color: '#dc2626', background: '#fef2f2', border: '1px solid #f87171', padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: '13px' }}>
            Erreur: {simError}
          </div>
        )}

        {simResult && (
          <div style={{ background: dk('#1e293b', '#f8fafc'), padding: '15px', borderRadius: '12px', border: `1px solid ${dk('#334155', '#e5e7eb')}` }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', color: dk('#94a3b8', '#64748b') }}>Estimation du coût total</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#f97316' }}>{formatMoney(simResult.total)}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', textAlign: 'left', marginBottom: '14px' }}>
              <div style={{ background: dk('#0f172a', '#ffffff'), border: `1px solid ${dk('#334155', '#e5e7eb')}`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: dk('#94a3b8', '#64748b'), fontWeight: 700 }}>TARIF UNITAIRE</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a' }}>{formatMoney(simResult.tarifUnit)}</div>
              </div>
              <div style={{ background: dk('#0f172a', '#ffffff'), border: `1px solid ${dk('#334155', '#e5e7eb')}`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: dk('#94a3b8', '#64748b'), fontWeight: 700 }}>REMISE</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#b91c1c' }}>
                  {Number.isFinite(Number(simResult.remisePercent)) ? `${(Number(simResult.remisePercent) * 100).toFixed(0)}%` : '0%'}
                </div>
              </div>
              <div style={{ background: dk('#0f172a', '#ffffff'), border: `1px solid ${dk('#334155', '#e5e7eb')}`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: dk('#94a3b8', '#64748b'), fontWeight: 700 }}>NB MAGASINS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: dk('#f8fafc', '#0f172a') }}>{Number(simResult.nbMagasins) || 0}</div>
              </div>
              <div style={{ background: dk('#0f172a', '#ffffff'), border: `1px solid ${dk('#334155', '#e5e7eb')}`, borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '11px', color: dk('#94a3b8', '#64748b'), fontWeight: 700 }}>MAJORATION</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: simResult.hasMajoration ? '#ea580c' : dk('#94a3b8', '#334155') }}>
                  {simResult.hasMajoration ? 'ACTIVE' : 'NON'}
                </div>
              </div>
            </div>

            {Array.isArray(simResult.storesBreakdown) && simResult.storesBreakdown.length > 0 && (
              <div style={{ marginTop: '16px', overflowX: 'auto', border: `1px solid ${dk('#334155', '#e5e7eb')}`, borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                  <thead>
                    <tr style={{ background: dk('#0f172a', '#f1f5f9') }}>
                      <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', borderBottom: `1px solid ${dk('#334155', '#e5e7eb')}`, color: dk('#e2e8f0', '#334155') }}>Magasin</th>
                      <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', borderBottom: `1px solid ${dk('#334155', '#e5e7eb')}`, color: dk('#e2e8f0', '#334155') }}>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simResult.storesBreakdown.map((s, idx) => (
                      <tr key={`break-${idx}`}>
                        <td style={{ padding: '8px', borderBottom: `1px solid ${dk('#1e293b', '#f1f5f9')}`, fontSize: '12px', color: dk('#cbd5e1', '#1e293b') }}>{s.name || `Magasin ${idx + 1}`}</td>
                        <td style={{ padding: '8px', borderBottom: `1px solid ${dk('#1e293b', '#f1f5f9')}`, textAlign: 'right', fontSize: '12px', fontWeight: 700, color: dk('#cbd5e1', '#1e293b') }}>{formatMoney(s.montantNet || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions (Sticky Footer) ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '16px 32px',
        margin: '32px -32px -24px', /* Extend horizontally inside the container */
        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(248, 250, 252, 0.95)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        bottom: '0px', /* Safely locks to the bottom-most visible pixel of the screen */
        zIndex: 40,
        borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
        boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.05)'
      }}>
        <button className={dk('dark-save-btn', 'light-save-btn')} onClick={onSave}>
          Enregistrer
        </button>
      </div>
    </section>
  )
}