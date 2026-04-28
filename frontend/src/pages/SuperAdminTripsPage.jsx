import React, { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../utils/apiBase'

const STORAGE_KEY = 'rtournee_super_admin_trips_drafts'

const EMPTY_FORM = {
  affcode: '',
  artcode: '',
  otdcode: '',
  otscontainer: '',
  otsetat: '',
  sitcode: '',
  tiecode: '',
  toucode: '',
  voycle: '',
  voydtd: '',
  voyhrd: '',
  voypal: '',
  salId: '',
  selectedChauffeurId: '',
  selectedCamionId: '',
  sitechauff: '',
  sitecamion: '',
  salmemoe: '',
  salmobilite: '',
  chargement: '',
  voymemo: '',
  states: 'pending',
}

const FIELD_GROUPS = [
  [
    { key: 'affcode', label: 'Affaire', type: 'text', placeholder: 'AFF001' },
    { key: 'artcode', label: 'Article', type: 'text', placeholder: 'ART001' },
    { key: 'otdcode', label: 'Client / OTD', type: 'text', placeholder: 'OTD001' },
    { key: 'voycle', label: 'Code voyage', type: 'text', placeholder: 'V-2026-001' },
  ],
  [
    { key: 'sitcode', label: 'Site', type: 'text', placeholder: 'SIT001' },
    { key: 'tiecode', label: 'Tiers', type: 'text', placeholder: 'TIE001' },
    { key: 'toucode', label: 'Tournée', type: 'text', placeholder: 'TOU001' },
    { key: 'otscontainer', label: 'Container', type: 'text', placeholder: 'C123' },
  ],
  [
    { key: 'voydtd', label: 'Date départ', type: 'date' },
    { key: 'voyhrd', label: 'Heure départ', type: 'time' },
    { key: 'voypal', label: 'Palettes', type: 'number', placeholder: '0' },
  ],
  [
    { key: 'sitechauff', label: 'Site chauffeur', type: 'text', placeholder: 'Bureau / dépôt' },
    { key: 'sitecamion', label: 'Site camion', type: 'text', placeholder: 'Dépôt camion' },
    { key: 'salmemoe', label: 'Chauffeur', type: 'text', placeholder: 'Nom chauffeur' },
    { key: 'salmobilite', label: 'Mobilité', type: 'text', placeholder: 'Mobile' },
  ],
]

function readDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizePayload(form, userDisplayName) {
  const payload = {
    affcode: form.affcode.trim() || null,
    artcode: form.artcode.trim() || null,
    otdcode: form.otdcode.trim() || null,
    otscontainer: form.otscontainer.trim() || null,
    otsetat: form.otsetat.trim() || null,
    sitcode: form.sitcode.trim() || null,
    tiecode: form.tiecode.trim() || null,
    toucode: form.toucode.trim() || null,
    voycle: form.voycle.trim() || null,
    voydtd: form.voydtd || null,
    voyhrd: form.voyhrd || null,
    voypal: form.voypal === '' ? null : Number(form.voypal),
    salId: form.salId || null,
    sitechauff: form.sitechauff.trim() || null,
    sitecamion: form.sitecamion.trim() || null,
    salmemoe: form.salmemoe.trim() || null,
    salmobilite: form.salmobilite.trim() || null,
    chargement: form.chargement.trim() || null,
    voymemo: form.voymemo.trim() || null,
    // Creation flow is fixed to pending; state changes happen later in dedicated workflows.
    states: 'pending',
    createdBy: userDisplayName || null,
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== null && value !== ''))
}

export default function SuperAdminTripsPage({ theme, userDisplayName = '' }) {
  const dk = (d, l) => (theme === 'dark' ? d : l)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [savedDrafts, setSavedDrafts] = useState(() => readDrafts())
  const [remoteTrips, setRemoteTrips] = useState([])
  const [chauffeurs, setChauffeurs] = useState([])
  const [camions, setCamions] = useState([])
  const [chauffeurSearch, setChauffeurSearch] = useState('')
  const [camionSearch, setCamionSearch] = useState('')

  const drafts = useMemo(() => {
    const merged = [...remoteTrips, ...savedDrafts]
    const seen = new Set()
    return merged.filter((row) => {
      const key = String(row?.id ?? row?.voycle ?? row?.toucode ?? row?.otdcode ?? row?.affcode ?? JSON.stringify(row))
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [remoteTrips, savedDrafts])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDrafts))
  }, [savedDrafts])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(apiUrl('/api/transport-data?limit=25'))
      .then(async (res) => {
        const json = await res.json().catch(() => ([]))
        if (!res.ok) {
          throw new Error(typeof json?.message === 'string' ? json.message : 'Erreur chargement transport_data')
        }
        return Array.isArray(json) ? json : []
      })
      .then((rows) => {
        if (!mounted) return
          setRemoteTrips(rows.slice(0, 25).map((row) => ({ ...row, source: 'db' })))
      })
      .catch(() => {
        if (!mounted) return
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    Promise.all([
      fetch(apiUrl('/api/base-chauffeur')).then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) return []
        return Array.isArray(json?.items) ? json.items : []
      }),
      fetch(apiUrl('/api/base-camion')).then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) return []
        return Array.isArray(json?.items) ? json.items : []
      }),
    ])
      .then(([chauffeurItems, camionItems]) => {
        if (!mounted) return
        setChauffeurs(chauffeurItems)
        setCamions(camionItems)
      })
      .catch(() => {
        if (!mounted) return
        setChauffeurs([])
        setCamions([])
      })

    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo(() => {
    const pending = drafts.filter((row) => String(row.states ?? 'pending') === 'pending').length
    const done = drafts.filter((row) => String(row.states ?? '') === 'done').length
    return { pending, done, total: drafts.length }
  }, [drafts])

  const filteredChauffeurs = useMemo(() => {
    const q = chauffeurSearch.trim().toLowerCase()
    if (!q) return chauffeurs
    return chauffeurs.filter((c) => {
      const fullName = `${String(c.nom ?? '').trim()} ${String(c.prenom ?? '').trim()}`.toLowerCase()
      return (
        fullName.includes(q) ||
        String(c.cin ?? '').toLowerCase().includes(q) ||
        String(c.tel ?? '').toLowerCase().includes(q)
      )
    })
  }, [chauffeurs, chauffeurSearch])

  const filteredCamions = useMemo(() => {
    const q = camionSearch.trim().toLowerCase()
    if (!q) return camions
    return camions.filter((c) => String(c.camion ?? '').toLowerCase().includes(q))
  }, [camions, camionSearch])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
    setMessage('')
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setError('')
    setMessage('')
  }

  const saveTrip = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = normalizePayload(form, userDisplayName)
      const res = await fetch(apiUrl('/api/transport-data'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'Enregistrement impossible')
      }

      setMessage('Trip chauffeur créé avec succès.')
      setSavedDrafts((prev) => [{ ...data, source: 'db' }, ...prev].slice(0, 25))
      resetForm()
    } catch (err) {
      setError(err?.message || 'Erreur enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="content" style={{ padding: '16px 20px 32px' }}>
      <div className="card" style={{ marginBottom: 16, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: 10 }}>
          <div style={{ fontSize: '30px', backgroundColor: '#fff7ed', padding: '10px', borderRadius: '12px' }}>🧑‍✈️</div>
          <div>
            <h2 className="title-orange" style={{ margin: 0 }}>SUPER ADMIN</h2>
            <p style={{ margin: '4px 0 0', color: dk('#94a3b8', '#64748b'), fontSize: '13px' }}>
              Section réservée au super admin pour créer un nouveau trip chauffeur dans transport_data.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 14 }}>
          <div style={{ padding: 14, borderRadius: 12, border: '1px solid #e5e7eb', background: '#f8fafc' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#1e293b' }}>{stats.total}</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fffbeb' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>Pending</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#b45309' }}>{stats.pending}</div>
          </div>
          <div style={{ padding: 14, borderRadius: 12, border: '1px solid #e5e7eb', background: '#ecfdf5' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>Done</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#047857' }}>{stats.done}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>Créer un trip chauffeur</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
              Les champs sont envoyés vers la table transport_data.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={resetForm} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={saveTrip}
              disabled={saving}
              style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: saving ? '#fdba74' : '#f97316', color: '#fff', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}
            >
              {saving ? '⏳ Enregistrement...' : '💾 Enregistrer'}
            </button>
          </div>
        </div>

        {error && <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>{error}</div>}
        {message && <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 13 }}>{message}</div>}

        <div style={{ display: 'grid', gap: 14 }}>
          {FIELD_GROUPS.map((group, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {group.map((field) => (
                <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{field.label}</span>
                  {field.key === 'salmemoe' ? (
                    <>
                      <input
                        type="text"
                        value={chauffeurSearch}
                        onChange={(e) => setChauffeurSearch(e.target.value)}
                        placeholder="Rechercher chauffeur (nom / CIN / tel)"
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, outline: 'none', marginBottom: 6 }}
                      />
                      <select
                        value={form.selectedChauffeurId}
                        onChange={(e) => {
                          const selectedId = e.target.value
                          const chauffeur = chauffeurs.find((c) => String(c.id) === selectedId)
                          setForm((prev) => ({
                            ...prev,
                            selectedChauffeurId: selectedId,
                            salId: chauffeur ? String(chauffeur.id) : '',
                            salmemoe: chauffeur ? `${String(chauffeur.nom ?? '').trim()} ${String(chauffeur.prenom ?? '').trim()}`.trim() : '',
                            salmobilite: chauffeur ? String(chauffeur.tel ?? '').trim() : prev.salmobilite,
                          }))
                        }}
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', background: '#fff' }}
                      >
                        <option value="">Sélectionner un chauffeur ({filteredChauffeurs.length})</option>
                        {filteredChauffeurs.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {`${String(c.nom ?? '').trim()} ${String(c.prenom ?? '').trim()}`.trim()}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : field.key === 'sitecamion' ? (
                    <>
                      <input
                        type="text"
                        value={camionSearch}
                        onChange={(e) => setCamionSearch(e.target.value)}
                        placeholder="Rechercher camion"
                        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 12, outline: 'none', marginBottom: 6 }}
                      />
                      <select
                        value={form.selectedCamionId}
                        onChange={(e) => {
                          const selectedId = e.target.value
                          const camion = camions.find((c) => String(c.id) === selectedId)
                          setForm((prev) => ({
                            ...prev,
                            selectedCamionId: selectedId,
                            sitecamion: camion ? String(camion.camion ?? '').trim() : '',
                          }))
                        }}
                        style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', background: '#fff' }}
                      >
                        <option value="">Sélectionner un camion ({filteredCamions.length})</option>
                        {filteredCamions.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {String(c.camion ?? '').trim()}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <input
                      type={field.type}
                      value={form[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
                    />
                  )}
                </label>
              ))}
            </div>
          ))}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Chargement</span>
              <input
                type="text"
                value={form.chargement}
                onChange={(e) => setField('chargement', e.target.value)}
                placeholder="Type de chargement"
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>État</span>
              <input
                type="text"
                value="pending"
                disabled
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', background: '#f8fafc', color: '#475569' }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Mémo</span>
            <textarea
              rows={4}
              value={form.voymemo}
              onChange={(e) => setField('voymemo', e.target.value)}
              placeholder="Commentaires sur le trip"
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', resize: 'vertical' }}
            />
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, color: '#1e293b' }}>Derniers trips</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>Chargés depuis transport_data.</p>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{loading ? 'Chargement...' : `${drafts.length} lignes`}</div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Aff', 'OTD', 'TMS', 'Chauffeur', 'Date', 'Heure', 'État'].map((header) => (
                  <th key={header} style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', borderBottom: '1px solid #e5e7eb', fontWeight: 800 }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {drafts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 18, color: '#94a3b8', textAlign: 'center' }}>
                    Aucun trip enregistré.
                  </td>
                </tr>
              ) : (
                drafts.map((row, index) => (
                  <tr key={`${row.id ?? row.voycle ?? index}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{row.affcode || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{row.otdcode || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{row.toucode || row.voycle || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{row.salmemoe || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{row.voydtd || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#374151' }}>{row.voyhrd || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: String(row.states ?? 'pending') === 'done' ? '#ecfdf5' : '#fff7ed',
                          color: String(row.states ?? 'pending') === 'done' ? '#047857' : '#c2410c',
                          fontWeight: 800,
                        }}
                      >
                        {String(row.states ?? 'pending')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}