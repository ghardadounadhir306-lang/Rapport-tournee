import React, { useState, useEffect, useMemo } from 'react'
import { apiUrl } from '../utils/apiBase'

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmtMin(m) {
  if (!Number.isFinite(m)) return '—'
  const abs = Math.abs(m)
  const h = Math.floor(abs / 60)
  const mm = Math.round(abs % 60)
  const sign = m < 0 ? '−' : '+'
  if (h > 0) return `${sign}${h}h${String(mm).padStart(2, '0')}`
  return `${sign}${mm} min`
}

function fmtDuration(m) {
  if (!Number.isFinite(m) || m <= 0) return '—'
  const h = Math.floor(m / 60)
  const mm = Math.round(m % 60)
  if (h > 0) return `${h}h${String(mm).padStart(2, '0')}`
  return `${mm} min`
}

function fmtKm(n) {
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(1).replace('.', ',') + ' km'
}

function fmtDate(d) {
  if (!d) return '—'
  const s = String(d)
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`
  return s
}

/* ─── SVG Circular Gauge ────────────────────────────────────────────────── */
function ConformityGauge({ value, label, color, secondaryColor, icon }) {
  const radius = 38
  const stroke = 6
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - value / 100)
  const displayVal = Math.round(value)

  return (
    <div className="opt-gauge">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={secondaryColor} />
          </linearGradient>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="45" cy="45" r={radius} fill="none" stroke="currentColor" strokeWidth={stroke}
          className="opt-gauge-track" opacity="0.1" />
        <circle cx="45" cy="45" r={radius} fill="none"
          stroke={`url(#grad-${label})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 45 45)"
          className="opt-gauge-value"
          filter={`url(#glow-${label})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
        <text x="45" y="40" textAnchor="middle" className="opt-gauge-pct" fill={color} style={{fontSize: '20px'}}>{displayVal}%</text>
        <text x="45" y="60" textAnchor="middle" className="opt-gauge-icon" style={{fontSize: '14px'}}>{icon}</text>
      </svg>
      <div className="opt-gauge-label">{label}</div>
    </div>
  )
}

/* ─── KPI Card ──────────────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, accent }) {
  return (
    <div className="opt-kpi-card" style={{ '--accent': accent }}>
      <div className="opt-kpi-icon">{icon}</div>
      <div className="opt-kpi-body">
        <div className="opt-kpi-value">{value}</div>
        <div className="opt-kpi-label">{label}</div>
        {sub && <div className="opt-kpi-sub">{sub}</div>}
      </div>
    </div>
  )
}

/* ─── Badge ─────────────────────────────────────────────────────────────── */
function Badge({ type, ok }) {
  return (
    <span className={`opt-badge ${ok === null || ok === undefined ? 'opt-badge--na' : ok ? 'opt-badge--ok' : 'opt-badge--ko'}`}>
      {type && <span style={{ opacity: 0.8, marginRight: 4 }}>{type}</span>}
      {ok === null || ok === undefined ? '—' : ok ? '✓' : '✗'} {ok === null || ok === undefined ? 'N/A' : ok ? 'Conf.' : 'Non conf.'}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   OPTIMISATION PAGE — uses real backend endpoint GET /api/tms/optimisation
   ═══════════════════════════════════════════════════════════════════════════ */
export default function OptimisationPage({ theme }) {
  const dk = (d, l) => theme === 'dark' ? d : l

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [rows, setRows] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  /* ── Fetch from backend (single request) ───────────────────────────────── */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(apiUrl('/api/tms/optimisation'))
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          throw new Error(`Erreur ${res.status}: ${txt || res.statusText}`)
        }
        const data = await res.json()
        if (!cancelled) {
          setStats(data.stats ?? null)
          setRows(data.rows ?? [])
        }
      } catch (e) {
        console.error('OptimisationPage fetch error:', e)
        if (!cancelled) setError(e.message || 'Erreur de chargement')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  /* ── Derived ───────────────────────────────────────────────────────────── */
  const ecartKmGlobal = stats ? (stats.totalKmReel - stats.totalKmTh) : 0
  const ecartKmGlobalPct = stats && stats.totalKmTh > 0
    ? ((ecartKmGlobal / stats.totalKmTh) * 100).toFixed(1)
    : '—'

  /* ═════════════════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <section className="content opt-page" data-theme={theme}>
        <div className="opt-loading">
          <div className="opt-spinner" />
          <span>Chargement des données d'optimisation…</span>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={`content opt-page ${dk('opt-dark', 'opt-light')}`}>
        <div className="opt-header">
          <div className="opt-header-left">
            <div className="opt-header-icon">📈</div>
            <div>
              <h1 className="opt-title">Tableau de bord — Optimisation</h1>
            </div>
          </div>
        </div>
        <div style={{
          padding: 24, borderRadius: 12,
          background: dk('#450a0a', '#fef2f2'),
          border: `1px solid ${dk('#7f1d1d', '#fecaca')}`,
          color: '#b91c1c', fontWeight: 600, fontSize: 14
        }}>
          ❌ {error}
          <div style={{ marginTop: 8, fontSize: 12, color: dk('#94a3b8', '#6b7280'), fontWeight: 400 }}>
            Vérifiez que le backend tourne sur le bon port et que la base de données est accessible.
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={`content opt-page ${dk('opt-dark', 'opt-light')}`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="opt-header">
        <div className="opt-header-left">
          <div className="opt-header-icon">📈</div>
          <div>
            <h1 className="opt-title">Tableau de bord — Optimisation</h1>
            <p className="opt-subtitle">
              Analyse des écarts KM et temps entre tournées réelles et théoriques (OSRM).
              <br />
              <span className="opt-hint">
                Pour l'optimisation de tournée sur carte, utilisez l'onglet <strong>OPT. TOURNÉE</strong>.
              </span>
            </p>
          </div>
        </div>
        <div className="opt-header-badge">
          {stats?.analyzed ?? 0} / {stats?.total ?? 0} analysées
        </div>
      </div>

      {/* ── Conformity Gauges + KPIs ───────────────────────────────────────── */}
      <div className="opt-top-grid">
        <div className="opt-gauges-panel">
          <div className="opt-panel-label">CONFORMITÉ GLOBALE</div>
          <div className="opt-gauges-row">
            <ConformityGauge
              value={stats?.pctKm ?? 0}
              label="Conformité KM"
              color="#10b981"
              secondaryColor="#059669"
              icon="🛣️"
            />
            <ConformityGauge
              value={stats?.pctTemps ?? 0}
              label="Conformité Temps"
              color="#6366f1"
              secondaryColor="#4f46e5"
              icon="⏱️"
            />
          </div>
          <div className="opt-gauges-legend">
            <span>
              <span className="opt-dot" style={{ background: '#10b981' }} />
              KM: {stats?.conformeKmCount ?? 0}/{stats?.totalWithKm ?? 0} conformes (±10%)
            </span>
            <span>
              <span className="opt-dot" style={{ background: '#6366f1' }} />
              Temps: {stats?.conformeTCount ?? 0}/{stats?.totalWithTemps ?? 0} conformes (±15%)
            </span>
          </div>
        </div>

        <div className="opt-kpis-grid">
          <KpiCard
            icon="🚚"
            label="Total Tournées"
            value={stats?.total ?? 0}
            sub={`${stats?.analyzed ?? 0} avec données`}
            accent="#f97316"
          />
          <KpiCard
            icon="🛣️"
            label="KM Total Réel"
            value={fmtKm(stats?.totalKmReel)}
            sub={`Théorique: ${fmtKm(stats?.totalKmTh)}`}
            accent="#10b981"
          />
          <KpiCard
            icon="📊"
            label="Écart KM Global"
            value={fmtKm(ecartKmGlobal)}
            sub={ecartKmGlobalPct !== '—' ? `${ecartKmGlobalPct}%` : '—'}
            accent={ecartKmGlobal > 0 ? '#ef4444' : '#10b981'}
          />
          <KpiCard
            icon="⏱️"
            label="Durée Totale"
            value={fmtDuration(stats?.totalDureeReelle)}
            sub={`${stats?.total ?? 0} tournées`}
            accent="#6366f1"
          />
        </div>
      </div>

      {/* ── Detail Table ───────────────────────────────────────────────────── */}
      <div className="opt-table-panel">
        <div className="opt-table-header">
          <div className="opt-panel-label">DÉTAIL PAR TOURNÉE</div>
          <div className="opt-table-count">{rows.length} tournée(s)</div>
        </div>

        <div className="opt-table-scroll">
          <table className="opt-table">
            <thead>
              <tr>
                <th>Tournée</th>
                <th>Véhicule & Chauffeur</th>
                <th className="opt-cell-center">Clients</th>
                <th>Distance (Réel / Théo)</th>
                <th>Temps (Durée / Est.)</th>
                <th>Conformité (KM & Temps)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" className="opt-empty">Aucune tournée trouvée</td></tr>
              ) : (
                rows.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`opt-row ${expandedId === r.id ? 'opt-row--active' : ''}`}
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      <td className="opt-cell-group">
                        <div style={{ fontWeight: 800, fontSize: 13, color: dk('#f8fafc', '#1e293b'), marginBottom: 2 }}>{r.wms || '—'}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: dk('#94a3b8', '#64748b') }}>{fmtDate(r.date)}</div>
                      </td>
                      <td className="opt-cell-group">
                        <div style={{ fontWeight: 700, fontSize: 12, color: dk('#cbd5e1', '#475569'), marginBottom: 4 }}>{r.driver || '—'}</div>
                        <div><span className="opt-truck-badge">{r.truck || '—'}</span></div>
                      </td>
                      <td className="opt-cell-center" style={{ fontSize: 14, fontWeight: 800 }}>{r.nbClients || 0}</td>
                      <td className="opt-cell-group">
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: dk('#f1f5f9', '#1e293b') }}>{r.kmReel != null ? r.kmReel.toFixed(1) : '—'}</span>
                          <span style={{ fontSize: 10, color: dk('#64748b', '#94a3b8'), fontWeight: 600 }}>km</span>
                        </div>
                        <div style={{ fontSize: 11, color: dk('#94a3b8', '#64748b'), fontWeight: 500 }}>
                          Théo: {r.kmTheorique > 0 ? r.kmTheorique.toFixed(1) : '—'} 
                          {r.decalageKm != null && <span className={`opt-pct ${r.decalageKm > 0 ? 'opt-val-neg' : 'opt-val-pos'}`}> ({r.decalageKm > 0 ? '+' : ''}{r.decalageKm.toFixed(1)})</span>}
                        </div>
                      </td>
                      <td className="opt-cell-group">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: dk('#f1f5f9', '#1e293b') }}>{fmtDuration(r.dureeReelle)}</span>
                          <span style={{ fontSize: 10, color: dk('#94a3b8', '#64748b'), fontWeight: 600, background: dk('#1e293b', '#f1f5f9'), padding: '2px 6px', borderRadius: 4 }}>{r.hDepart || '—'} ➔ {r.hRetour || '—'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: dk('#94a3b8', '#64748b'), fontWeight: 500 }}>
                          Est: {fmtDuration(r.dureeEstimee)} 
                          {r.decalageTemps != null && <span className={`opt-pct ${r.decalageTemps > 0 ? 'opt-val-neg' : 'opt-val-pos'}`}> ({r.decalageTemps > 0 ? '+' : ''}{fmtMin(r.decalageTemps)})</span>}
                        </div>
                      </td>
                      <td className="opt-cell-group">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <Badge type="KM" ok={r.conformiteKm} />
                          <Badge type="TMP" ok={r.conformiteTemps} />
                        </div>
                      </td>
                      <td className="opt-cell-expand">
                        <span className={`opt-chevron ${expandedId === r.id ? 'opt-chevron--open' : ''}`}>▾</span>
                      </td>
                    </tr>

                    {/* ── Expanded client detail row ─── */}
                    {expandedId === r.id && r.clients && r.clients.length > 0 && (
                      <tr className="opt-detail-row">
                        <td colSpan="7">
                          <div className="opt-detail-panel">
                            <div className="opt-detail-title">
                              Détail clients — {r.wms || r.id}
                              <span className="opt-detail-meta">
                                Camion: <strong>{r.truck}</strong> · Livreur: <strong>{r.driver}</strong> · Site: <strong>{r.site || '—'}</strong>
                              </span>
                            </div>
                            <div className="opt-detail-cards">
                              <div className="opt-detail-summary">
                                <div className={`opt-mini-gauge ${r.conformiteKm ? 'ok' : r.conformiteKm === false ? 'ko' : 'na'}`}>
                                  <div className="opt-mini-label">Conformité KM</div>
                                  <div className="opt-mini-val">{r.conformiteKm == null ? 'N/A' : r.conformiteKm ? '✓ Conforme' : '✗ Non conforme'}</div>
                                  <div className="opt-mini-detail">
                                    Réel: {r.kmReel != null ? `${r.kmReel.toFixed(1)} km` : '—'} vs Théo: {r.kmTheorique > 0 ? `${r.kmTheorique.toFixed(1)} km` : '—'}
                                  </div>
                                </div>
                                <div className={`opt-mini-gauge ${r.conformiteTemps ? 'ok' : r.conformiteTemps === false ? 'ko' : 'na'}`}>
                                  <div className="opt-mini-label">Conformité Temps</div>
                                  <div className="opt-mini-val">{r.conformiteTemps == null ? 'N/A' : r.conformiteTemps ? '✓ Conforme' : '✗ Non conforme'}</div>
                                  <div className="opt-mini-detail">
                                    Durée: {fmtDuration(r.dureeReelle)} vs Estimée: {fmtDuration(r.dureeEstimee)}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <table className="opt-client-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Code Client</th>
                                  <th>Région</th>
                                  <th>KM Théorique</th>
                                  <th>KM Arrivée</th>
                                  <th>Arrivée</th>
                                  <th>Départ</th>
                                  <th>Livrée</th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.clients.map((c, idx) => (
                                  <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td className="opt-cell-mono">{c.code}</td>
                                    <td>{c.region || '—'}</td>
                                    <td className="opt-cell-num">{c.kmTh || '—'}</td>
                                    <td className="opt-cell-num">{c.kmArv || '—'}</td>
                                    <td className="opt-cell-time">{c.arrivee || '—'}</td>
                                    <td className="opt-cell-time">{c.depart || '—'}</td>
                                    <td className="opt-cell-center">
                                      {c.livree
                                        ? <span className="opt-livree-ok">✓</span>
                                        : <span className="opt-livree-ko">✗</span>
                                      }
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                    {expandedId === r.id && (!r.clients || r.clients.length === 0) && (
                      <tr className="opt-detail-row">
                        <td colSpan="7">
                          <div className="opt-detail-panel" style={{ textAlign: 'center', padding: 24, color: dk('#94a3b8', '#6b7280') }}>
                            Aucun client enregistré pour cette tournée.
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
