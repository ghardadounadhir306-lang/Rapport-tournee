import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { apiUrl } from '../../utils/apiBase'

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

const SITE_BADGE = {
  'TS-SAH': { bg: '#c2410c', fg: '#fff7ed' },
  'TS-BAR': { bg: '#a16207', fg: '#fefce8' },
  'TS-TUN': { bg: '#15803d', fg: '#ecfdf5' },
}
const TYPE_BADGE = {
  'TRP EXT': { bg: '#334155', fg: '#e2e8f0' },
  LL: { bg: '#475569', fg: '#f1f5f9' },
  PC: { bg: '#52525b', fg: '#fafafa' },
}

function hashHue(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i)
  return Math.abs(h) % 360
}

function badgeStyleSite(site, dark) {
  const fixed = SITE_BADGE[site?.trim()]
  if (fixed) return { background: fixed.bg, color: fixed.fg, border: 'none' }
  const hue = hashHue(site || 'x')
  return {
    background: dark ? `hsla(${hue}, 45%, 32%, 1)` : `hsla(${hue}, 55%, 88%, 1)`,
    color: dark ? '#f8fafc' : '#0f172a',
    border: 'none',
  }
}

function badgeStyleType(type, dark) {
  const fixed = TYPE_BADGE[type?.trim()]
  if (fixed) return { background: fixed.bg, color: fixed.fg, border: 'none' }
  const hue = hashHue(`t:${type}`)
  return {
    background: dark ? `hsla(${hue}, 30%, 28%, 1)` : `hsla(${hue}, 40%, 90%, 1)`,
    color: dark ? '#f1f5f9' : '#1e293b',
    border: 'none',
  }
}

function exportCamionsXlsx(rows) {
  const aoa = [
    ['CAMION', 'MARQUE', 'SITE', 'TYPE', 'AFFECTATION', 'CAPACITÉ', 'UTILE'],
    ...rows.map((r) => [r.camion, r.marque, r.site, r.type, r.affectation, r.capacite, r.utile]),
  ]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Camions')
  XLSX.writeFile(wb, `base_camion_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const emptyForm = () => ({
  camion: '',
  marque: '',
  site: '',
  type: '',
  affectation: '',
  capacite: '',
  utile: '',
})

/**
 * Base camion — données en base PostgreSQL (`base_camion`), API `/api/base-camion`.
 */
export default function ParametrageCamionTab({ theme }) {
  const dk = (d, l) => (theme === 'dark' ? d : l)
  const dark = theme === 'dark'
  const fileRef = useRef(null)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSite, setFilterSite] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErr, setFormErr] = useState(null)

  const loadList = useCallback(async () => {
    setLoadErr(null)
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/base-camion'))
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrMsg(data, res))
      const items = data.items ?? []
      setRows(items.map((r) => ({ ...r, id: String(r.id) })))
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Chargement impossible')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
  }, [loadList])

  const siteOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.site).filter(Boolean))
    return Array.from(s).sort()
  }, [rows])

  const typeOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.type).filter(Boolean))
    return Array.from(s).sort()
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (filterSite && r.site !== filterSite) return false
      if (filterType && r.type !== filterType) return false
      if (!q) return true
      const hay = [r.camion, r.marque, r.site, r.type, r.affectation, r.capacite, r.utile].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search, filterSite, filterType])

  const actualiser = useCallback(() => {
    loadList()
  }, [loadList])

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormErr(null)
    setModalOpen(true)
  }

  const openEdit = (r) => {
    setEditingId(r.id)
    setFormErr(null)
    setForm({
      camion: r.camion,
      marque: r.marque,
      site: r.site,
      type: r.type,
      affectation: r.affectation,
      capacite: String(r.capacite ?? ''),
      utile: String(r.utile ?? ''),
    })
    setModalOpen(true)
  }

  const saveModal = async (e) => {
    e.preventDefault()
    setFormErr(null)
    const camion = form.camion.trim()
    if (!camion) return
    const body = {
      camion,
      marque: form.marque.trim(),
      site: form.site.trim(),
      type: form.type.trim(),
      affectation: form.affectation.trim(),
      capacite: form.capacite.trim(),
      utile: form.utile.trim(),
    }
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(apiUrl(`/api/base-camion/${encodeURIComponent(editingId)}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(apiErrMsg(data, res))
      } else {
        const res = await fetch(apiUrl('/api/base-camion'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(apiErrMsg(data, res))
      }
      setModalOpen(false)
      await loadList()
    } catch (err) {
      setFormErr(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce camion de la base ?')) return
    try {
      const res = await fetch(apiUrl(`/api/base-camion/${encodeURIComponent(id)}`), { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrMsg(data, res))
      await loadList()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Suppression impossible')
    }
  }

  const onImport = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const fd = new FormData()
    fd.append('file', f)
    try {
      const res = await fetch(apiUrl('/api/base-camion/import'), { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrMsg(data, res))
      await loadList()
      alert(`Import terminé : ${data.count ?? 0} ligne(s) en base.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Import impossible')
    }
  }

  const shellBg = dk('#0f172a', '#f8fafc')
  const barBg = dk('#1e293b', '#ffffff')
  const border = dk('#334155', '#e2e8f0')
  const text = dk('#e2e8f0', '#0f172a')
  const muted = dk('#94a3b8', '#64748b')
  const theadBg = dk('#1e293b', '#f1f5f9')
  const rowOdd = dk('#0f172a', '#ffffff')
  const rowEven = dk('#111c2f', '#f8fafc')

  const panelBorderRadius = 14

  const btnGhost = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: dk('#1e293b', '#fff'),
    color: text,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }

  const selectStyle = {
    padding: '10px 12px',
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: dk('#1e293b', '#fff'),
    color: text,
    fontSize: 13,
    minWidth: 160,
    cursor: 'pointer',
  }

  const searchWrap = {
    flex: '1 1 220px',
    maxWidth: 360,
    position: 'relative',
  }

  if (loading && rows.length === 0 && !loadErr) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: dk('#94a3b8', '#64748b'), fontWeight: 600 }}>
        Chargement de la base camion…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {loadErr && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: dk('#450a0a', '#fef2f2'),
            color: dk('#fecaca', '#b91c1c'),
            fontSize: 14,
            border: `1px solid ${dk('#7f1d1d', '#fecaca')}`,
          }}
        >
          {loadErr}
        </div>
      )}
    <div
      style={{
        borderRadius: panelBorderRadius,
        border: `1px solid ${border}`,
        background: shellBg,
        overflow: 'hidden',
        boxShadow: dark ? '0 8px 32px rgba(0,0,0,.35)' : '0 4px 14px rgba(15,23,42,.08)',
      }}
    >
      {/* Barre filtres + actions */}
      <div
        style={{
          padding: '16px 18px',
          background: barBg,
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        <div style={searchWrap}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6 }}>Rechercher</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none' }}>🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px 10px 36px',
                borderRadius: 8,
                border: `1px solid ${border}`,
                background: dk('#0f172a', '#f8fafc'),
                color: text,
                fontSize: 14,
              }}
            />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6 }}>Site</label>
          <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} style={selectStyle}>
            <option value="">Tous les sites</option>
            {siteOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 6 }}>Type</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
            <option value="">Tous les types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
          <button type="button" style={btnGhost} onClick={actualiser} disabled={loading} title="Recharger depuis la base">
            <span aria-hidden>↻</span> Actualiser
          </button>
          <button type="button" style={btnGhost} onClick={() => exportCamionsXlsx(filtered)} disabled={filtered.length === 0}>
            ⬇ Exporter Excel
          </button>
          <button type="button" style={btnGhost} onClick={() => fileRef.current?.click()}>
            ⬆ Importer Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={onImport} />
          <button
            type="button"
            onClick={openAdd}
            style={{
              ...btnGhost,
              background: 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)',
              border: 'none',
              color: '#fff',
              boxShadow: '0 2px 10px rgba(249,115,22,0.4)',
            }}
          >
            + Ajouter
          </button>
          <span style={{ fontWeight: 800, color: '#f97316', fontSize: 14, whiteSpace: 'nowrap', marginLeft: 4 }}>
            {filtered.length} camion(s)
          </span>
        </div>
      </div>

      {/* Tableau */}
      <div style={{ overflow: 'auto', maxHeight: 'min(65vh, 640px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: theadBg, color: muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800 }}>Camion</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800 }}>Marque</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800 }}>Site</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800 }}>Type</th>
              <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 800 }}>Affectation</th>
              <th style={{ textAlign: 'right', padding: '12px 14px', fontWeight: 800 }}>Capacité</th>
              <th style={{ textAlign: 'right', padding: '12px 14px', fontWeight: 800 }}>Utile</th>
              <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 800, width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? rowOdd : rowEven, borderTop: `1px solid ${border}`, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = dk('#1a2744', '#fff7ed')}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? rowOdd : rowEven}
              >
                <td style={{ padding: '11px 14px', fontWeight: 800, color: '#f97316' }}>{r.camion}</td>
                <td style={{ padding: '11px 14px', color: text }}>{r.marque || '—'}</td>
                <td style={{ padding: '11px 14px' }}>
                  {r.site ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 800,
                        ...badgeStyleSite(r.site, dark),
                      }}
                    >
                      {r.site}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  {r.type ? (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        ...badgeStyleType(r.type, dark),
                      }}
                    >
                      {r.type}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '11px 14px', color: muted }}>{r.affectation || '—'}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.capacite || '—'}</td>
                <td style={{ padding: '11px 14px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.utile || '—'}</td>
                <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    style={{
                      marginRight: 6,
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${dk('#f97316', '#fdba74')}`,
                      background: dk('#431407', '#fff7ed'),
                      color: '#ea580c',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${dk('#7f1d1d', '#fecaca')}`,
                      background: dk('#450a0a', '#fef2f2'),
                      color: '#ef4444',
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: muted }}>Aucun camion — importez un fichier ou cliquez sur « Ajouter ».</div>
        )}
      </div>
    </div>

      {/* Modal ajout / édition */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}
        >
          <form
            onSubmit={saveModal}
            style={{
              width: '100%',
              maxWidth: 480,
              background: dk('#1e293b', '#fff'),
              borderRadius: 12,
              padding: 22,
              border: `1px solid ${border}`,
              boxShadow: '0 20px 50px rgba(0,0,0,.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 800, fontSize: 17, color: '#f97316', marginBottom: 16 }}>{editingId ? 'Modifier le camion' : 'Nouveau camion'}</div>
            {formErr && (
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: dk('#450a0a', '#fef2f2'), color: dk('#fecaca', '#b91c1c'), fontSize: 13 }}>
                {formErr}
              </div>
            )}
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                ['camion', 'Camion (immat.) *', true],
                ['marque', 'Marque', false],
                ['site', 'Site', false],
                ['type', 'Type', false],
                ['affectation', 'Affectation', false],
                ['capacite', 'Capacité', false],
                ['utile', 'Utile', false],
              ].map(([key, label, req]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: muted, marginBottom: 4 }}>{label}</label>
                  <input
                    required={!!req}
                    value={form[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `1px solid ${border}`,
                      background: dk('#0f172a', '#f8fafc'),
                      color: text,
                      fontSize: 14,
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ ...btnGhost, background: dk('#334155', '#f1f5f9') }}>
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 800,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.85 : 1,
                  background: 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)',
                  color: '#fff',
                }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
