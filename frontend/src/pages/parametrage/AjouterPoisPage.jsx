import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { apiUrl } from '../../utils/apiBase'

/** Export des lignes affichées (respecte le filtre Rechercher). */
function exportPoisToXlsx(rows) {
  const aoa = [
    ['Code client', 'Nom client', 'Latitude', 'Longitude', 'Type', 'Source', 'Groupe', 'Créé par'],
    ...rows.map((r) => [
      r.code,
      r.nom ?? '',
      Number.isFinite(r.lat) ? r.lat : '',
      Number.isFinite(r.lng) ? r.lng : '',
      r.isDepot ? 'Dépôt' : 'Client',
      r.source ?? '',
      r.groupe ?? '',
      r.creePar ?? '',
    ]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'POI clients')
  XLSX.writeFile(wb, `client_poi_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/** Extrait le message d’erreur NestJS / HTTP (message string ou tableau). */
function apiErrMsg(data, res) {
  if (data == null || typeof data !== 'object') {
    return res?.statusText || `Erreur HTTP ${res?.status ?? ''}`.trim()
  }
  const m = data.message
  if (Array.isArray(m)) return m.filter(Boolean).join(' ')
  if (typeof m === 'string' && m.trim()) return m
  if (typeof data.error === 'string' && data.error.trim()) return data.error
  return `Erreur ${res?.status ?? ''}`.trim()
}

function emptyForm(defaultCreePar = '') {
  return {
    code: '',
    nom: '',
    latitude: '',
    longitude: '',
    isDepot: false,
    source: '',
    groupe: '',
    creePar: defaultCreePar,
  }
}

function resolveMode(mode) {
  return mode === 'depots' ? 'depots' : 'clients'
}

/**
 * Saisie / modification POI — aligné clients_poi.xlsx (Code, Nom, Lat, Lng, dépôt, source, groupe, créé par).
 * Enregistrement direct via API Nest (POST/PUT/DELETE).
 */
export default function AjouterPoisPage({ theme, userDisplayName = '', mode = 'clients' }) {
  const viewMode = resolveMode(mode)
  const isDepotMode = viewMode === 'depots'
  const isClientMode = viewMode === 'clients'
  const dk = (d, l) => (theme === 'dark' ? d : l)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState(null)
  const [editingCode, setEditingCode] = useState(null)
  const [saveOk, setSaveOk] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(() => ({ ...emptyForm(userDisplayName), isDepot: isDepotMode }))

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      creePar: prev.creePar || userDisplayName,
      isDepot: isDepotMode ? true : false,
    }))
  }, [userDisplayName, isDepotMode])

  const loadList = useCallback(async () => {
    setLoadErr(null)
    setLoading(true)
    try {
      const path = isDepotMode ? '/api/clients-poi/depots' : '/api/clients-poi/clients'
      const res = await fetch(apiUrl(path))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(apiErrMsg(data, res))
      }
      setItems(data.items ?? [])
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Chargement impossible')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [isDepotMode])

  useEffect(() => {
    loadList()
  }, [loadList])

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter((r) => {
      const hay = [
        r.code,
        r.nom,
        r.source,
        r.groupe,
        r.creePar,
        r.isDepot ? 'dépôt' : 'client',
        Number.isFinite(r.lat) ? String(r.lat) : '',
        Number.isFinite(r.lng) ? String(r.lng) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [items, searchQuery])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErr(null)
  }

  const openNewClient = () => {
    setEditingCode(null)
    setForm({ ...emptyForm(userDisplayName), isDepot: isDepotMode })
    setFormErr(null)
    setSaveOk(false)
    setShowForm(true)
  }

  const startEdit = (row) => {
    setEditingCode(row.code)
    setForm({
      code: row.code,
      nom: row.nom ?? '',
      latitude: Number.isFinite(row.lat) ? String(row.lat) : '',
      longitude: Number.isFinite(row.lng) ? String(row.lng) : '',
      isDepot: !!row.isDepot,
      source: row.source ?? '',
      groupe: row.groupe ?? '',
      creePar: row.creePar ?? '',
    })
    setFormErr(null)
    setShowForm(true)
  }

  const cancelEdit = () => {
    setEditingCode(null)
    setForm({ ...emptyForm(userDisplayName), isDepot: isDepotMode })
    setFormErr(null)
    setShowForm(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setFormErr(null)
    const lat = Number.parseFloat(String(form.latitude).replace(',', '.'))
    const lng = Number.parseFloat(String(form.longitude).replace(',', '.'))
    if (!form.code?.trim()) {
      setFormErr(isDepotMode ? 'Code dépôt obligatoire' : 'Code client obligatoire')
      return
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFormErr('Latitude et longitude numériques obligatoires')
      return
    }

    setSaving(true)
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        nom: form.nom.trim(),
        latitude: lat,
        longitude: lng,
        isDepot: form.isDepot,
        source: form.source.trim(),
        groupe: form.groupe.trim(),
        creePar: form.creePar.trim() || userDisplayName || undefined,
      }

      if (isDepotMode) body.isDepot = true
      else if (isClientMode) body.isDepot = false

      if (editingCode) {
        const url = apiUrl(`/api/clients-poi/${encodeURIComponent(editingCode)}`)
        const res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: body.nom,
            latitude: body.latitude,
            longitude: body.longitude,
            isDepot: body.isDepot,
            source: body.source,
            groupe: body.groupe,
            creePar: body.creePar,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(apiErrMsg(data, res))
        }
      } else {
        const res = await fetch(apiUrl('/api/clients-poi'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(apiErrMsg(data, res))
        }
      }
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 6000)
      cancelEdit()
      await loadList()
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  const handleExportExcel = () => {
    exportPoisToXlsx(filteredItems)
  }

  const handleDelete = async (code) => {
    if (!window.confirm(`Supprimer le POI « ${code} » ?`)) return
    try {
      const res = await fetch(apiUrl(`/api/clients-poi/${encodeURIComponent(code)}`), { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(apiErrMsg(data, res))
      }
      if (editingCode === code) cancelEdit()
      await loadList()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Suppression impossible')
    }
  }

  const panelStyle = {
    background: dk('#111827', '#ffffff'),
    border: `1px solid ${dk('#374151', '#e2e8f0')}`,
    borderRadius: 14,
    padding: 20,
    boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,.3)' : '0 4px 14px rgba(249,115,22,.12)',
  }
  const label = { display: 'block', fontWeight: 700, fontSize: 12, color: dk('#94a3b8', '#64748b'), marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1.5px solid ${dk('#4b5563', '#e2e8f0')}`,
    background: dk('#1f2937', '#fff'),
    color: dk('#f9fafb', '#111827'),
    fontSize: 14,
    boxSizing: 'border-box',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  }

  if (loading && items.length === 0 && !loadErr) {
    return (
      <div style={{ ...panelStyle, textAlign: 'center', color: dk('#9ca3af', '#6b7280') }}>
        Chargement…
      </div>
    )
  }

  const btnSecondaryToolbar = {
    padding: '12px 18px',
    borderRadius: 10,
    border: `1px solid ${dk('#4b5563', '#d1d5db')}`,
    background: dk('#1f2937', '#fff'),
    fontWeight: 700,
    cursor: 'pointer',
    color: dk('#e5e7eb', '#374151'),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <div
        style={{
          ...panelStyle,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={openNewClient}
          style={{
            padding: '12px 22px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            cursor: 'pointer',
            background: 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(249,115,22,0.35)',
          }}
        >
          {isDepotMode ? 'Nouveau dépôt' : 'Nouveau client'}
        </button>
        <button type="button" onClick={() => loadList()} style={btnSecondaryToolbar}>
          Actualiser la liste
        </button>
        <button
          type="button"
          onClick={handleExportExcel}
          disabled={items.length === 0}
          style={{
            ...btnSecondaryToolbar,
            cursor: items.length === 0 ? 'not-allowed' : 'pointer',
            opacity: items.length === 0 ? 0.5 : 1,
          }}
        >
          Exporter Excel
        </button>
      </div>

      {showForm && (
      <form style={panelStyle} onSubmit={submit}>
        <div style={{ fontWeight: 800, color: '#f97316', marginBottom: 14, fontSize: 15 }}>
          {editingCode
            ? `Modifier — ${editingCode}`
            : isDepotMode
              ? 'Nouveau dépôt'
              : 'Nouveau point client (POI)'}
        </div>
        {saveOk && (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: '#ecfdf5', color: '#047857', fontSize: 13, fontWeight: 700, borderLeft: '4px solid #22c55e' }}>
            Enregistrement effectué.
          </div>
        )}
        {formErr && (
          <div style={{ marginBottom: 12, padding: 10, borderRadius: 10, background: '#fef2f2', color: '#b91c1c', fontSize: 13, borderLeft: '4px solid #ef4444' }}>
            {formErr}
          </div>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
          }}
        >
          <div>
            <label style={label}>{isDepotMode ? 'Code dépôt *' : 'Code client *'}</label>
            <input
              style={{ ...inputStyle, opacity: editingCode ? 0.75 : 1 }}
              value={form.code}
              onChange={(e) => setField('code', e.target.value.toUpperCase())}
              placeholder={isDepotMode ? 'ex. MGH' : 'ex. CLT001'}
              disabled={!!editingCode}
              required
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={label}>{isDepotMode ? 'Nom dépôt' : 'Nom client'}</label>
            <input style={inputStyle} value={form.nom} onChange={(e) => setField('nom', e.target.value)} placeholder={isDepotMode ? 'Nom du dépôt' : 'Raison sociale'} />
          </div>
          <div>
            <label style={label}>Latitude *</label>
            <input style={inputStyle} value={form.latitude} onChange={(e) => setField('latitude', e.target.value)} placeholder="36.8" required />
          </div>
          <div>
            <label style={label}>Longitude *</label>
            <input style={inputStyle} value={form.longitude} onChange={(e) => setField('longitude', e.target.value)} placeholder="10.2" required />
          </div>
          {!isDepotMode && !isClientMode && (
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, color: dk('#e5e7eb', '#374151') }}>
                <input type="checkbox" checked={form.isDepot} onChange={(e) => setField('isDepot', e.target.checked)} />
                Dépôt
              </label>
            </div>
          )}
          <div>
            <label style={label}>Source</label>
            <input style={inputStyle} value={form.source} onChange={(e) => setField('source', e.target.value)} placeholder="Manuel, import…" />
          </div>
          <div>
            <label style={label}>Groupe</label>
            <input style={inputStyle} value={form.groupe} onChange={(e) => setField('groupe', e.target.value)} />
          </div>
          <div>
            <label style={label}>Créé par</label>
            <input style={inputStyle} value={form.creePar} onChange={(e) => setField('creePar', e.target.value)} placeholder={userDisplayName || '…'} />
          </div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 22px',
              borderRadius: 10,
              border: 'none',
              fontWeight: 800,
              cursor: saving ? 'wait' : 'pointer',
              background: 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)',
              color: '#fff',
              boxShadow: '0 2px 8px rgba(249,115,22,0.35)',
            }}
          >
            {saving ? 'Enregistrement…' : editingCode ? 'Enregistrer les modifications' : 'Enregistrer en base'}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: `1px solid ${dk('#4b5563', '#d1d5db')}`,
              background: dk('#1f2937', '#f8fafc'),
              fontWeight: 700,
              cursor: 'pointer',
              color: dk('#e5e7eb', '#475569'),
            }}
          >
            {editingCode ? 'Annuler' : 'Fermer'}
          </button>
        </div>
      </form>
      )}

      {loadErr && (
        <div style={{ ...panelStyle, borderColor: '#fecaca', color: '#b91c1c', fontSize: 14 }}>{loadErr}</div>
      )}

      <div style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${dk('#374151', '#e5e7eb')}`,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 800, color: dk('#e5e7eb', '#334155') }}>
            {isDepotMode ? 'Dépôts en base' : 'POI en base'} ({items.length}
            {searchQuery.trim() ? ` — ${filteredItems.length} affiché(s)` : ''})
          </div>
          <div style={{ flex: '1 1 220px', maxWidth: 420, minWidth: 180 }}>
            <label style={{ ...label, marginBottom: 4 }}>Rechercher</label>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Code, nom, groupe, source, créé par…"
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
        </div>
        <div style={{ overflow: 'auto', maxHeight: 'min(50vh, 480px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: dk('#1f2937', 'linear-gradient(180deg, #f8fafc, #f1f5f9)') }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Code</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Nom</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Lat</th>
                <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Lng</th>
                {!isDepotMode && <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Type</th>}
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Source</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Groupe</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Créé par</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: dk('#94a3b8', '#475569') }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((r) => (
                <tr key={r.code} style={{ borderTop: `1px solid ${dk('#374151', '#f1f5f9')}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = dk('#1e293b', '#fff7ed')}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '8px 12px', fontWeight: 700 }}>{r.code}</td>
                  <td style={{ padding: '8px 12px' }}>{r.nom || '—'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{Number.isFinite(r.lat) ? r.lat : '—'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{Number.isFinite(r.lng) ? r.lng : '—'}</td>
                  {!isDepotMode && <td style={{ padding: '8px 12px' }}>{r.isDepot ? 'Dépôt' : 'Client'}</td>}
                  <td style={{ padding: '8px 12px', color: dk('#94a3b8', '#64748b') }}>{r.source || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{r.groupe || '—'}</td>
                  <td style={{ padding: '8px 12px' }}>{r.creePar || '—'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      style={{ marginRight: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid #fdba74', background: '#fff7ed', color: '#c2410c', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.code)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && !loading && (
            <div style={{ padding: 28, textAlign: 'center', color: dk('#94a3b8', '#94a3b8') }}>
              {isDepotMode
                ? 'Aucun dépôt — cliquez sur « Nouveau dépôt » pour en ajouter un.'
                : 'Aucun POI — cliquez sur « Nouveau client » pour en ajouter un.'}
            </div>
          )}
          {items.length > 0 && filteredItems.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: dk('#94a3b8', '#94a3b8') }}>Aucun résultat pour « {searchQuery.trim()} ».</div>
          )}
        </div>
      </div>
    </div>
  )
}

