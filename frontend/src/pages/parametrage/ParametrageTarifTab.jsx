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

function emptyForm(creePar = '') {
  return { typeCode: '', distMin: '', distMax: '', capMin: '', capMax: '', tarifBase: '', creePar: creePar }
}

function fmtDateFR(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function fmtPrice(v) {
  if (v == null || !Number.isFinite(v)) return '\u2014'
  return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ParametrageTarifTab({ theme, userDisplayName = '' }) {
  const dk = (d, l) => (theme === 'dark' ? d : l)
  const dark = theme === 'dark'
  const fileRef = useRef(null)

  const [subTab, setSubTab] = useState('regles')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(() => emptyForm(userDisplayName))
  const [formErr, setFormErr] = useState(null)

  const [augModalOpen, setAugModalOpen] = useState(false)
  const [augMode, setAugMode] = useState('aug')
  const [augForm, setAugForm] = useState({ percent: '', dateEffet: '', description: '' })
  const [augSaving, setAugSaving] = useState(false)
  const [augErr, setAugErr] = useState(null)
  const [augmentations, setAugmentations] = useState([])

  const loadAll = useCallback(async () => {
    setLoadErr(null)
    setLoading(true)
    try {
      const res = await fetch(apiUrl('/api/base-tarif'))
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

  const loadAugmentations = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/base-tarif/augmentations'))
      const data = await res.json().catch(() => [])
      if (res.ok && Array.isArray(data)) setAugmentations(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadAll()
    loadAugmentations()
  }, [loadAll, loadAugmentations])

  useEffect(() => {
    setForm((prev) => ({ ...prev, creePar: prev.creePar || userDisplayName }))
  }, [userDisplayName])

  const typeOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.typeCode).filter(Boolean))
    return Array.from(s).sort()
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (filterType && r.typeCode !== filterType) return false
      if (!q) return true
      const hay = [r.typeCode, String(r.distMin), String(r.distMax), String(r.capMin), String(r.capMax), r.creePar].join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search, filterType])

  // Compute augmentation columns: each augmentation = a date column with cumulative factor
  const augColumns = useMemo(() => {
    const sorted = [...augmentations].sort((a, b) => a.dateEffet.localeCompare(b.dateEffet))
    let cumFactor = 1
    return sorted.map((a) => {
      cumFactor *= 1 + a.percent / 100
      return {
        id: a.id,
        dateEffet: a.dateEffet,
        percent: a.percent,
        cumulativePercent: Math.round((cumFactor - 1) * 10000) / 100,
        factor: cumFactor,
      }
    })
  }, [augmentations])

  const actualiser = useCallback(() => { loadAll(); loadAugmentations() }, [loadAll, loadAugmentations])

  const openAdd = () => { setEditingId(null); setForm(emptyForm(userDisplayName)); setFormErr(null); setModalOpen(true) }
  const openEdit = (r) => {
    setEditingId(r.id); setFormErr(null)
    setForm({
      typeCode: r.typeCode ?? '', distMin: String(r.distMin ?? ''), distMax: String(r.distMax ?? ''),
      capMin: String(r.capMin ?? ''), capMax: String(r.capMax ?? ''),
      tarifBase: r.tarifBase != null ? String(r.tarifBase) : '',
      creePar: r.creePar ?? userDisplayName ?? '',
    })
    setModalOpen(true)
  }

  const buildPayload = () => {
    const distMin = Number.parseFloat(String(form.distMin).replace(',', '.'))
    const distMax = Number.parseFloat(String(form.distMax).replace(',', '.'))
    const capMin = Number.parseFloat(String(form.capMin).replace(',', '.'))
    const capMax = Number.parseFloat(String(form.capMax).replace(',', '.'))
    const tarifBaseRaw = String(form.tarifBase).trim()
    const tarifBase = tarifBaseRaw === '' ? null : Number.parseFloat(tarifBaseRaw.replace(',', '.'))
    return { typeCode: form.typeCode.trim(), distMin, distMax, capMin, capMax, tarifBase: tarifBaseRaw === '' ? null : tarifBase, tarifsParDate: {}, creePar: form.creePar.trim() }
  }

  const saveModal = async (e) => {
    e.preventDefault(); setFormErr(null); setSaving(true)
    try {
      const body = buildPayload()
      if (!body.typeCode) throw new Error('TYPE CODE obligatoire')
      if (![body.distMin, body.distMax, body.capMin, body.capMax].every((x) => Number.isFinite(x))) throw new Error('DIST / CAP : valeurs obligatoires')
      if (body.tarifBase != null && !Number.isFinite(body.tarifBase)) throw new Error('TARIF BASE invalide')
      const url = editingId ? apiUrl(`/api/base-tarif/${encodeURIComponent(editingId)}`) : apiUrl('/api/base-tarif')
      const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrMsg(data, res))
      setModalOpen(false); await loadAll()
    } catch (err) { setFormErr(err instanceof Error ? err.message : 'Erreur') } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer cette regle ?')) return
    try {
      const res = await fetch(apiUrl(`/api/base-tarif/${encodeURIComponent(id)}`), { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrMsg(data, res))
      await loadAll()
    } catch (err) { alert(err instanceof Error ? err.message : 'Erreur') }
  }

  const onImport = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    const fd = new FormData(); fd.append('file', f)
    try {
      const res = await fetch(apiUrl('/api/base-tarif/import'), { method: 'POST', body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrMsg(data, res))
      await loadAll(); alert(`Import : ${data.count ?? 0} ligne(s).`)
    } catch (err) { alert(err instanceof Error ? err.message : 'Import impossible') }
  }

  // ─── Augmentation / Reduction modal ──────────────────────────────
  const openAugModal = (mode = 'aug') => {
    setAugMode(mode)
    setAugForm({ percent: '', dateEffet: '', description: '' })
    setAugErr(null)
    setAugModalOpen(true)
  }

  const saveAugmentation = async (e) => {
    e.preventDefault(); setAugErr(null)
    const raw = Number.parseFloat(String(augForm.percent).replace(',', '.'))
    if (!Number.isFinite(raw) || raw <= 0) { setAugErr('Pourcentage invalide (nombre > 0)'); return }
    if (!augForm.dateEffet) { setAugErr("La date d'effet est obligatoire"); return }
    const percent = augMode === 'red' ? -raw : raw
    setAugSaving(true)
    try {
      const res = await fetch(apiUrl('/api/base-tarif/augmentations'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent, dateEffet: augForm.dateEffet, appliedBy: userDisplayName, description: augForm.description.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(apiErrMsg(data, res))
      setAugModalOpen(false); await loadAugmentations()
    } catch (err) { setAugErr(err instanceof Error ? err.message : 'Erreur') } finally { setAugSaving(false) }
  }

  const deleteAugmentation = async (id) => {
    if (!window.confirm('Supprimer cette augmentation ?')) return
    try {
      const res = await fetch(apiUrl(`/api/base-tarif/augmentations/${id}`), { method: 'DELETE' })
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(apiErrMsg(data, res)) }
      await loadAugmentations()
    } catch (err) { alert(err instanceof Error ? err.message : 'Erreur') }
  }

  const activeAugs = augmentations.filter((a) => a.active)
  const totalAugPercent = useMemo(() => {
    let factor = 1
    for (const a of activeAugs) factor *= 1 + a.percent / 100
    return Math.round((factor - 1) * 10000) / 100
  }, [activeAugs])

  // ─── Styles ────────────────────────────────────────────────────────
  const shellBg = dk('#0f172a', '#f8fafc')
  const barBg = dk('#1e293b', '#ffffff')
  const border = dk('#334155', '#e2e8f0')
  const text = dk('#e2e8f0', '#0f172a')
  const muted = dk('#94a3b8', '#64748b')
  const theadBg = dk('#1e3a5f', '#f1f5f9')
  const rowOdd = dk('#0f172a', '#ffffff')
  const rowEven = dk('#111c2f', '#f8fafc')

  const btnGhost = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: `1px solid ${border}`, background: dk('#1e293b', '#fff'), color: text, fontWeight: 700, fontSize: 13, cursor: 'pointer' }
  const tabBtn = (active) => ({ padding: '10px 18px', borderRadius: 8, border: `1px solid ${active ? '#f97316' : border}`, background: active ? dk('#431407', '#fff7ed') : dk('#1e293b', '#fff'), color: active ? '#ea580c' : text, fontWeight: 800, fontSize: 14, cursor: 'pointer' })
  const selectStyle = { padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: dk('#1e293b', '#fff'), color: text, fontSize: 13, minWidth: 160, cursor: 'pointer' }
  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${border}`, background: dk('#0f172a', '#f8fafc'), color: text, fontSize: 14 }
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: muted, marginBottom: 4 }
  const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, overflow: 'auto' }
  const modalStyle = { width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', background: dk('#1e293b', '#fff'), borderRadius: 16, padding: 28, border: `1px solid ${border}`, boxShadow: '0 24px 60px rgba(0,0,0,.45)' }

  if (loading && rows.length === 0 && !loadErr) {
    return <div style={{ padding: 48, textAlign: 'center', color: muted, fontWeight: 600 }}>Chargement...</div>
  }

  const rulesCount = rows.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      {loadErr && (
        <div style={{ padding: 12, borderRadius: 8, background: dk('#450a0a', '#fef2f2'), color: dk('#fecaca', '#b91c1c'), fontSize: 14, border: `1px solid ${dk('#7f1d1d', '#fecaca')}` }}>
          {loadErr}
        </div>
      )}

      {/* Active augmentation banner */}
      {activeAugs.length > 0 && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: totalAugPercent >= 0 ? dk('#14532d', '#ecfdf5') : dk('#450a0a', '#fef2f2'), border: `1px solid ${totalAugPercent >= 0 ? dk('#166534', '#86efac') : dk('#7f1d1d', '#fecaca')}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: totalAugPercent >= 0 ? dk('#4ade80', '#16a34a') : dk('#ef4444', '#dc2626'), fontSize: 14 }}>
            {totalAugPercent >= 0 ? '+' : ''}{totalAugPercent}% {totalAugPercent >= 0 ? 'augmentation' : 'reduction'} active
          </span>
          {activeAugs.map((a) => (
            <span key={a.id} style={{ fontSize: 12, color: a.percent > 0 ? dk('#bbf7d0', '#166534') : dk('#fecaca', '#991b1b'), background: a.percent > 0 ? dk('#052e16', '#dcfce7') : dk('#450a0a', '#fef2f2'), padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>
              {a.percent > 0 ? '+' : ''}{a.percent}% depuis {fmtDateFR(a.dateEffet)}
            </span>
          ))}
        </div>
      )}

      <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: shellBg, overflow: 'hidden', boxShadow: dark ? '0 8px 32px rgba(0,0,0,.35)' : '0 4px 14px rgba(15,23,42,.08)' }}>
        {/* Toolbar */}
        <div style={{ padding: '10px 14px', background: barBg, borderBottom: `1px solid ${border}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          <button type="button" style={tabBtn(subTab === 'regles')} onClick={() => setSubTab('regles')}>Regles {rulesCount}</button>
          <button type="button" style={tabBtn(subTab === 'tarifs')} onClick={() => setSubTab('tarifs')}>Tarifs {augColumns.length}</button>
          <div style={{ width: 1, height: 28, background: border, margin: '0 4px' }} />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher type..." style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${border}`, background: dk('#0f172a', '#f8fafc'), color: text, fontSize: 13, width: 180 }} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={selectStyle}>
            <option value="">Tous les types</option>
            {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <button type="button" style={btnGhost} onClick={actualiser} disabled={loading}>&#8635; Actualiser</button>
          <button type="button" style={btnGhost} onClick={() => {
            const headers = ['TYPE CODE', 'DIST MIN', 'DIST MAX', 'CAP MIN', 'CAP MAX', 'TARIF BASE', ...augColumns.map((c) => `${fmtDateFR(c.dateEffet)} (${c.percent > 0 ? '+' : ''}${c.percent}%)`), 'CREE PAR']
            const aoa = [headers, ...filtered.map((r) => [r.typeCode, r.distMin, r.distMax, r.capMin, r.capMax, r.tarifBase ?? '', ...augColumns.map((c) => r.tarifBase != null ? Math.round(r.tarifBase * c.factor * 100) / 100 : ''), r.creePar ?? ''])]
            const ws = XLSX.utils.aoa_to_sheet(aoa); const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Regles tarif'); XLSX.writeFile(wb, `base_tarif_${new Date().toISOString().slice(0, 10)}.xlsx`)
          }} disabled={filtered.length === 0}>&#11015; Exporter</button>
          <button type="button" style={btnGhost} onClick={() => fileRef.current?.click()}>&#11014; Importer</button>
          <a href="/tarifs-stagiaire.xlsx" download="Tarifs Stagiaire.xlsx" style={{ ...btnGhost, textDecoration: 'none', color: '#ea580c', borderColor: dk('#ea580c', '#fdba74'), background: dk('#431407', '#fff7ed') }} title="Modele Excel">Modele .xlsx</a>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={onImport} />
          <button type="button" onClick={openAdd} style={{ ...btnGhost, background: 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)', border: 'none', color: '#fff', boxShadow: '0 2px 10px rgba(249,115,22,0.4)' }}>+ Ajouter Regle</button>
          <button type="button" onClick={() => openAugModal('aug')} style={{ ...btnGhost, background: dk('#14532d', '#ecfdf5'), borderColor: dk('#166534', '#86efac'), color: dk('#bbf7d0', '#166534') }}>&#9650; Augmentation</button>
          <button type="button" onClick={() => openAugModal('red')} style={{ ...btnGhost, background: dk('#450a0a', '#fef2f2'), borderColor: dk('#7f1d1d', '#fecaca'), color: dk('#fecaca', '#dc2626') }}>&#9660; Reduction</button>
        </div>

        {/* TABLE */}
        <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: theadBg, color: dk('#e2e8f0', '#475569'), textTransform: 'uppercase', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 2 }}>
                {['TYPE CODE','DIST MIN','DIST MAX','CAP MIN','CAP MAX','TARIF BASE'].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '11px 12px', fontWeight: 800, fontSize: 11 }}>{h}</th>
                ))}
                {augColumns.map((c) => (
                  <th key={c.id} style={{ textAlign: 'right', padding: '11px 10px', fontWeight: 800, fontSize: 10, whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                    <div>{fmtDateFR(c.dateEffet)}</div>
                    <div style={{ color: c.percent > 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                      {c.percent > 0 ? '+' : ''}{c.percent}%
                    </div>
                  </th>
                ))}
                <th style={{ textAlign: 'left', padding: '11px 12px', fontWeight: 800, fontSize: 11 }}>CREE PAR</th>
                <th style={{ textAlign: 'center', padding: '11px 12px', fontWeight: 800, fontSize: 11, width: 110 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? rowOdd : rowEven, borderTop: `1px solid ${dk('#1e293b', '#e2e8f0')}`, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = dk('#1a2744', '#f1f5f9') }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? rowOdd : rowEven }}>
                  <td style={{ padding: '10px 12px', fontWeight: 800, color: '#f97316' }}>{r.typeCode}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{r.distMin}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.distMax}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.capMin}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.capMax}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{r.tarifBase != null ? Number(r.tarifBase).toLocaleString('fr-FR') : '\u2014'}</td>
                  {augColumns.map((c) => {
                    const base = r.tarifBase
                    const computed = base != null && Number.isFinite(base) ? Math.round(base * c.factor * 100) / 100 : null
                    return (
                      <td key={c.id} style={{ padding: '10px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: c.percent > 0 ? dk('#4ade80', '#16a34a') : dk('#f87171', '#dc2626') }}>
                        {fmtPrice(computed)}
                      </td>
                    )
                  })}
                  <td style={{ padding: '10px 12px', color: muted, fontSize: 12 }}>{r.creePar || '\u2014'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button type="button" onClick={() => openEdit(r)} style={{ marginRight: 4, padding: '4px 10px', borderRadius: 6, border: `1px solid ${dk('#f97316', '#fdba74')}`, background: dk('#431407', '#fff7ed'), color: '#ea580c', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Modifier</button>
                    <button type="button" onClick={() => remove(r.id)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${dk('#7f1d1d', '#fecaca')}`, background: dk('#450a0a', '#fef2f2'), color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && rows.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: muted, fontSize: 14 }}>Aucune regle en base &mdash; Telechargez le Modele .xlsx, remplissez-le, puis cliquez Importer.</div>}
          {filtered.length === 0 && rows.length > 0 && <div style={{ padding: 32, textAlign: 'center', color: muted }}>Aucun resultat pour cette recherche ou ce filtre.</div>}
        </div>
      </div>

      {/* Augmentations / reductions history */}
      {augmentations.length > 0 && (
        <div style={{ borderRadius: 12, border: `1px solid ${border}`, background: shellBg, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: barBg, borderBottom: `1px solid ${border}`, fontWeight: 800, fontSize: 14, color: text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: dk('#4ade80', '#16a34a') }}>%</span> Historique des augmentations / reductions
          </div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: theadBg, color: dk('#e2e8f0', '#475569'), textTransform: 'uppercase', fontSize: 11, fontWeight: 800 }}>
                  <th style={{ padding: '9px 12px', textAlign: 'center' }}>STATUT</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center' }}>TYPE</th>
                  <th style={{ padding: '9px 12px', textAlign: 'right' }}>%</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center' }}>DATE D&apos;EFFET</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>DESCRIPTION</th>
                  <th style={{ padding: '9px 12px', textAlign: 'left' }}>PAR</th>
                  <th style={{ padding: '9px 12px', textAlign: 'center', width: 80 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {augmentations.map((a) => {
                  const isActive = a.active
                  const isAug = a.percent > 0
                  const statusColor = isActive ? dk('#4ade80', '#16a34a') : dk('#94a3b8', '#64748b')
                  const statusLabel = isActive ? 'Active' : 'A venir'
                  const statusBg = isActive ? dk('#052e16', '#dcfce7') : dk('#1e293b', '#f1f5f9')
                  return (
                    <tr key={a.id} style={{ borderTop: `1px solid ${dk('#1e293b', '#e2e8f0')}`, background: isActive ? dk('#0c1f0f', '#f0fdf4') : 'transparent' }}>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg }}>{statusLabel}</span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: isAug ? dk('#4ade80', '#16a34a') : dk('#ef4444', '#dc2626'), background: isAug ? dk('#052e16', '#dcfce7') : dk('#450a0a', '#fef2f2') }}>
                          {isAug ? 'Augmentation' : 'Reduction'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: 15, color: isAug ? dk('#4ade80', '#16a34a') : dk('#ef4444', '#dc2626') }}>
                        {a.percent > 0 ? '+' : ''}{a.percent}%
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{fmtDateFR(a.dateEffet)}</td>
                      <td style={{ padding: '8px 12px', color: muted, fontSize: 12 }}>{a.description || '\u2014'}</td>
                      <td style={{ padding: '8px 12px', color: muted, fontSize: 12 }}>{a.appliedBy || '\u2014'}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button type="button" onClick={() => deleteAugmentation(a.id)} style={{ padding: '3px 8px', borderRadius: 6, border: `1px solid ${dk('#7f1d1d', '#fecaca')}`, background: dk('#450a0a', '#fef2f2'), color: '#ef4444', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Suppr.</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Rule modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <div role="dialog" aria-modal style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <form onSubmit={saveModal} style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#f97316', marginBottom: 20 }}>{editingId ? 'Modifier la regle' : 'Nouvelle regle'}</div>
            {formErr && <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: dk('#450a0a', '#fef2f2'), color: dk('#fecaca', '#b91c1c'), fontSize: 13 }}>{formErr}</div>}
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>TYPE CODE *</label>
                <input required value={form.typeCode} onChange={(e) => setForm((p) => ({ ...p, typeCode: e.target.value }))} style={inputStyle} />
              </div>
              {[['distMin', 'DIST MIN *'], ['distMax', 'DIST MAX *'], ['capMin', 'CAP MIN *'], ['capMax', 'CAP MAX *']].map(([key, label]) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input required value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>TARIF BASE</label>
                <input value={form.tarifBase} onChange={(e) => setForm((p) => ({ ...p, tarifBase: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>CREE PAR</label>
                <input value={form.creePar} onChange={(e) => setForm((p) => ({ ...p, creePar: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModalOpen(false)} style={{ ...btnGhost, background: dk('#334155', '#f1f5f9') }}>Annuler</button>
              <button type="submit" disabled={saving} style={{ padding: '10px 22px', borderRadius: 8, border: 'none', fontWeight: 800, cursor: saving ? 'wait' : 'pointer', background: 'linear-gradient(180deg, #fb923c 0%, #f97316 100%)', color: '#fff', opacity: saving ? 0.85 : 1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Augmentation / Reduction modal ─────────────────────── */}
      {augModalOpen && (() => {
        const isAug = augMode === 'aug'
        const gradientBg = isAug
          ? 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)'
          : 'linear-gradient(135deg, #dc2626 0%, #f87171 100%)'
        const accentColor = isAug ? dk('#4ade80', '#16a34a') : dk('#ef4444', '#dc2626')
        const previewBg = isAug ? dk('#052e16', '#f0fdf4') : dk('#450a0a', '#fef2f2')
        const previewBorder = isAug ? dk('#166534', '#86efac') : dk('#7f1d1d', '#fecaca')
        const shadowColor = isAug ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)'
        return (
          <div role="dialog" aria-modal style={overlayStyle} onClick={(e) => e.target === e.currentTarget && setAugModalOpen(false)}>
            <form onSubmit={saveAugmentation} style={{ ...modalStyle, maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: gradientBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', fontWeight: 800 }}>
                  {isAug ? '\u25B2' : '\u25BC'}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: text }}>{isAug ? 'Augmentation' : 'Reduction'}</div>
                  <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>Pourcentage et date d&apos;effet</div>
                </div>
              </div>

              {augErr && <div style={{ marginBottom: 14, padding: 10, borderRadius: 8, background: dk('#450a0a', '#fef2f2'), color: dk('#fecaca', '#b91c1c'), fontSize: 13 }}>{augErr}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Pourcentage *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      required type="text" placeholder="ex. 10"
                      value={augForm.percent}
                      onChange={(e) => setAugForm((p) => ({ ...p, percent: e.target.value }))}
                      style={{ ...inputStyle, paddingRight: 40, fontSize: 18, fontWeight: 800, textAlign: 'center' }}
                    />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 800, color: muted }}>%</span>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Date d&apos;effet *</label>
                  <input
                    required type="date"
                    value={augForm.dateEffet}
                    onChange={(e) => setAugForm((p) => ({ ...p, dateEffet: e.target.value }))}
                    style={inputStyle}
                  />
                  <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>S&apos;applique a partir de cette date</div>
                </div>

                <div>
                  <label style={labelStyle}>Description (optionnelle)</label>
                  <input
                    type="text" placeholder={isAug ? 'ex. Augmentation annuelle 2026' : 'ex. Remise promotionnelle'}
                    value={augForm.description}
                    onChange={(e) => setAugForm((p) => ({ ...p, description: e.target.value }))}
                    style={inputStyle}
                  />
                </div>

                {augForm.percent && augForm.dateEffet && (
                  <div style={{ padding: 14, borderRadius: 10, background: previewBg, border: `1px solid ${previewBorder}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: accentColor, marginBottom: 4 }}>Apercu</div>
                    <div style={{ fontSize: 14, color: text }}>
                      <strong>{isAug ? '+' : '-'}{augForm.percent}%</strong> sur tous les tarifs a partir du <strong>{fmtDateFR(augForm.dateEffet)}</strong>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setAugModalOpen(false)} style={{ ...btnGhost, background: dk('#334155', '#f1f5f9') }}>Annuler</button>
                <button type="submit" disabled={augSaving} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', fontWeight: 800, cursor: augSaving ? 'wait' : 'pointer', background: gradientBg, color: '#fff', opacity: augSaving ? 0.85 : 1, boxShadow: `0 2px 12px ${shadowColor}` }}>
                  {augSaving ? 'Enregistrement...' : 'Appliquer'}
                </button>
              </div>
            </form>
          </div>
        )
      })()}
    </div>
  )
}
