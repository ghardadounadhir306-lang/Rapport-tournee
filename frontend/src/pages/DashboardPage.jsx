import React, { useEffect, useState, useCallback } from 'react'
import { apiUrl } from '../utils/apiBase'

/* ─── tiny SVG bar chart ─────────────────────────────────────── */
function BarChart({ data = [], labelKey, valueKey, color = '#f97316', height = 160, formatValue, showPercent }) {
  if (!data.length) return <div style={{ height, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:13 }}>Aucune donnée</div>
  const vals = data.map(d => Number(d[valueKey]) || 0)
  const max = Math.max(...vals, 0.01)
  const W = 100 / data.length
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${Math.max(data.length * 36, 300)} ${height + 40}`} style={{ width:'100%', minWidth: data.length * 36, fontFamily:'inherit' }}>
        {data.map((d, i) => {
          const val = Number(d[valueKey]) || 0
          const barH = max > 0 ? (val / max) * height : 0
          const x = i * 36 + 4
          const y = height - barH
          const label = String(d[labelKey] ?? '').slice(-5)
          const display = formatValue ? formatValue(val) : showPercent ? `${val}%` : val
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={28} height={barH}
                rx={4} ry={4}
                fill={`url(#grad${i % 3})`}
                opacity={0.92}
              />
              {barH > 18 && (
                <text x={x + 14} y={y + Math.min(barH / 2, 18)} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="700">
                  {display}
                </text>
              )}
              <text x={x + 14} y={height + 14} textAnchor="middle" fontSize={8.5} fill="#64748b" transform={`rotate(-35 ${x+14} ${height+14})`}>
                {label}
              </text>
            </g>
          )
        })}
        <defs>
          <linearGradient id="grad0" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} /><stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <line x1={0} y1={height} x2={data.length * 36} y2={height} stroke="#e5e7eb" strokeWidth={1} />
      </svg>
    </div>
  )
}

/* ─── KPI card ───────────────────────────────────────────────── */
function KpiCard({ icon, label, value, unit = '', color, sub }) {
  return (
    <div style={{
      background: '#fff',
      borderLeft: `4px solid ${color}`,
      border: `1px solid #e2e8f0`,
      borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: color,
      borderRadius: 16, padding: '20px 18px',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}25` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ background: `${color}15`, borderRadius: 12, padding: 8, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.5px' }}>
        {value}<span style={{ fontSize: 13, fontWeight: 600, marginLeft: 4, color: `${color}99` }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

/* ─── section card ───────────────────────────────────────────── */
function Section({ title, icon, children, action }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', transition: 'box-shadow 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '2px solid #f1f5f9', background: 'linear-gradient(180deg, #f8fafc, #fff)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 17, background: '#fff7ed', borderRadius: 10, width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
          <span style={{ fontWeight: 800, color: '#1e293b', fontSize: 13, textTransform: 'uppercase', letterSpacing: '.4px' }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: '18px 18px 14px' }}>{children}</div>
    </div>
  )
}

/* ─── export CSV helper ──────────────────────────────────────── */
function exportCsv(filename, headers, rows) {
  const csv = [headers.join(';'), ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

/* ─── main component ─────────────────────────────────────────── */
export default function DashboardPage({ tms, list = [], activeFilterChips = [], alerts = [] }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [periode, setPeriode] = useState('30')
  const [view, setView] = useState('jour') // 'jour' | 'mois'

  const alertCount = alerts.filter(a => a.severity === 'ALERTE' || a.severity === 'BLOQUANT').length

  const fetchStats = useCallback((p) => {
    setLoading(true); setError(null)
    fetch(apiUrl(`/api/dashboard/stats?periode=${p}`))
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => { fetchStats(periode) }, [periode])

  /* ── export handlers ── */
  const exportSaisies = () => {
    if (!stats) return
    exportCsv('taux_saisie_par_jour.csv',
      ['Jour', 'Total Tournées', 'Saisies', 'Taux (%)'],
      stats.tauxSaisieParJour.map(r => [r.jour, r.total, r.saisies, r.taux])
    )
  }
  const exportMobilite = () => {
    if (!stats) return
    exportCsv('mobilite_chauffeurs.csv',
      ['Chauffeur', 'Saisies', 'Total TMS', 'Taux Mobilité (%)'],
      stats.mobiliteParChauffeur.map(r => [r.driver, r.saisies, r.total ?? 'N/A', r.tauxMobilite])
    )
  }
  const exportTarif = () => {
    if (!stats) return
    const rows = view === 'jour'
      ? stats.tarifParJour.map(r => [r.jour, r.km])
      : stats.tarifParMois.map(r => [r.mois, r.km])
    exportCsv(`tarif_km_par_${view}.csv`, ['Période', 'KM Total'], rows)
  }
  const exportAll = () => {
    exportSaisies(); exportMobilite(); exportTarif()
  }

  /* ── gauge ring ── */
  const GaugeRing = ({ pct, color, size = 70 }) => {
    const r = (size - 10) / 2
    const circ = 2 * Math.PI * r
    const offset = circ * (1 - (pct || 0) / 100)
    return (
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
        <text x={size/2} y={size/2+5} textAnchor="middle" fontSize={12} fontWeight="800" fill={color}>{pct}%</text>
      </svg>
    )
  }

  return (
    <section className="content">
      <div className="card">

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 24, flexWrap:'wrap', gap: 12 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
            <div style={{ fontSize:32, background:'linear-gradient(135deg,#fff7ed,#ffedd5)', padding:12, borderRadius:16, boxShadow:'0 4px 14px rgba(249,115,22,0.12)' }}>📊</div>
            <div>
              <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:'#1e293b', letterSpacing:'-0.02em' }}>TABLEAU DE BORD ANALYTIQUE</h2>
              <p style={{ margin:0, color:'#64748b', fontSize:12 }}>KPIs opérationnels — tournées, saisies, mobilité, tarif</p>
            </div>
          </div>
          <div style={{ display:'flex', gap: 10, alignItems:'center', flexWrap:'wrap' }}>
            {/* Période selector */}
            <select value={periode} onChange={e => setPeriode(e.target.value)}
              style={{ padding:'8px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:12, fontWeight:700, background:'#f8fafc', color:'#374151', cursor:'pointer', transition:'all 0.2s', outline:'none' }}
              onFocus={e => e.currentTarget.style.borderColor = '#f97316'}
              onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
              <option value="365">1 an</option>
            </select>
            <button onClick={exportAll} style={{
              background:'linear-gradient(135deg,#10b981,#059669)', color:'#fff', border:'none',
              padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:800, cursor:'pointer',
              display:'flex', alignItems:'center', gap:6, boxShadow:'0 3px 10px rgba(16,185,129,0.19)',
              transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,185,129,0.28)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(16,185,129,0.19)' }}>
              📥 Exporter tout (CSV)
            </button>
            <button onClick={() => fetchStats(periode)} style={{
              background:'#f1f5f9', color:'#475569', border:'1.5px solid #e2e8f0',
              padding:'8px 12px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer',
              transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.transform = 'translateY(0)' }}>
              🔄 Actualiser
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#94a3b8', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <div style={{ width:36, height:36, border:'3px solid #fed7aa', borderTopColor:'#f97316', borderRadius:'50%', animation:'spin 0.8s linear infinite', marginBottom:12 }} />
            <div style={{ fontSize:13 }}>Chargement des statistiques…</div>
          </div>
        )}

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderLeft:'4px solid #ef4444', borderRadius:12, padding:16, color:'#dc2626', fontSize:13, marginBottom:20, animation:'fadeIn 0.3s ease' }}>
            ⚠️ Erreur : {error}
          </div>
        )}

        {stats && !loading && (
          <>
            {/* ── KPI Cards ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:14, marginBottom:28 }}>
              <KpiCard icon="🚚" label="Total Tournées" value={stats.global.totalTournees.toLocaleString('fr-FR')} color="#f97316"
                sub="Transport data (TMS)" />
              <KpiCard icon="✍️" label="Total Saisies" value={stats.global.totalSaisies} color="#3b82f6"
                sub="Fiches opérateurs saisies" />
              <KpiCard icon="📍" label="Taux de saisie global" value={stats.global.tauxSaisieGlobal} unit="%" color={stats.global.tauxSaisieGlobal >= 50 ? '#10b981' : '#f59e0b'}
                sub={`${stats.global.totalSaisies} / ${stats.global.totalTournees}`} />
              <KpiCard icon="👨‍✈️" label="Chauffeurs actifs" value={stats.global.totalChauffeurs} color="#8b5cf6"
                sub="Conducteurs distincts" />
              <KpiCard icon="📏" label="KM Total" value={stats.global.totalKm.toLocaleString('fr-FR')} unit="km" color="#06b6d4"
                sub="km_tsp cumulés" />
              <KpiCard icon="⚠️" label="Alertes actives" value={alertCount} color={alertCount > 0 ? '#dc2626' : '#10b981'}
                sub={alertCount > 0 ? 'Requiert attention' : 'Système normal'} />
            </div>

            {/* ── Taux de saisie par jour ── */}
            <div style={{ marginBottom:20 }}>
              <Section title="Taux de Saisie par Jour" icon="📅"
                action={
                  <button onClick={exportSaisies} style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    📥 CSV
                  </button>
                }
              >
                <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
                  {/* mini gauge */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'#f8fafc', borderRadius:12, padding:'14px 18px', minWidth:100 }}>
                    <GaugeRing pct={stats.global.tauxSaisieGlobal} color="#f97316" />
                    <span style={{ fontSize:10, color:'#64748b', fontWeight:700 }}>TAUX GLOBAL</span>
                  </div>
                  <div style={{ flex:1, minWidth:250 }}>
                    <p style={{ margin:'0 0 10px', fontSize:12, color:'#64748b' }}>
                      Nombre de tournées saisies (formulaire rempli) par rapport au nombre total de tournées transport sur {stats.periode} jours.
                    </p>
                    <BarChart
                      data={stats.tauxSaisieParJour}
                      labelKey="jour"
                      valueKey="saisies"
                      color="#f97316"
                      height={140}
                    />
                  </div>
                </div>

                {/* mini table */}
                {stats.tauxSaisieParJour.length > 0 && (
                  <div style={{ overflowX:'auto', marginTop:8 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                      <thead>
                        <tr style={{ background:'linear-gradient(180deg, #f8fafc, #f1f5f9)' }}>
                          {['Jour','Total tournées','Saisies','Taux (%)'].map(h => (
                            <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:700, color:'#475569', borderBottom:'1px solid #e5e7eb', letterSpacing:'0.04em', textTransform:'uppercase', fontSize:11 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...stats.tauxSaisieParJour].reverse().slice(0,10).map((r,i) => (
                          <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='#f8fafc'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <td style={{ padding:'8px 12px', fontWeight:600 }}>{r.jour}</td>
                            <td style={{ padding:'8px 12px', color:'#374151' }}>{r.total}</td>
                            <td style={{ padding:'8px 12px', color:'#3b82f6', fontWeight:700 }}>{r.saisies}</td>
                            <td style={{ padding:'8px 12px' }}>
                              <span style={{ background: r.taux>=80?'#dcfce7':r.taux>=50?'#fef9c3':'#fee2e2', color:r.taux>=80?'#16a34a':r.taux>=50?'#92400e':'#dc2626', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                                {r.taux}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            </div>

            {/* ── Taux de mobilité par chauffeur ── */}
            <div style={{ marginBottom:20 }}>
              <Section title="Taux de Mobilité par Chauffeur" icon="👨‍✈️"
                action={
                  <button onClick={exportMobilite} style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    📥 CSV
                  </button>
                }
              >
                <p style={{ margin:'0 0 14px', fontSize:12, color:'#64748b' }}>
                  Part de chaque chauffeur dans le total des tournées saisies (formulaires opérateurs).
                </p>
                <BarChart
                  data={stats.mobiliteParChauffeur}
                  labelKey="driver"
                  valueKey="saisies"
                  color="#8b5cf6"
                  height={150}
                />
                {/* horizontal bar table */}
                <div style={{ marginTop:14 }}>
                  {stats.mobiliteParChauffeur.slice(0,10).map((r,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <div style={{ width:130, fontSize:11, color:'#374151', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.driver}</div>
                      <div style={{ flex:1, background:'#f1f5f9', borderRadius:20, height:14, position:'relative', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${r.tauxMobilite}%`, background:'linear-gradient(90deg,#8b5cf6,#c084fc)', borderRadius:20, transition:'width .5s ease' }} />
                      </div>
                      <div style={{ width:50, fontSize:11, fontWeight:800, color:'#8b5cf6', textAlign:'right' }}>{r.tauxMobilite}%</div>
                      <div style={{ width:40, fontSize:10, color:'#94a3b8', textAlign:'right' }}>{r.saisies} fiche{r.saisies>1?'s':''}</div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* ── Calcul global KM / Tarif par jour & mois ── */}
            <Section title="KM Transport (Tarif) — Par Jour / Mois" icon="💰"
              action={
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <div style={{ display:'flex', background:'#f1f5f9', borderRadius:8, overflow:'hidden', border:'1px solid #e2e8f0' }}>
                    {['jour','mois'].map(v => (
                      <button key={v} onClick={() => setView(v)} style={{
                        padding:'5px 12px', fontSize:11, fontWeight:700, border:'none', cursor:'pointer',
                        background: view===v ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent',
                        color: view===v ? '#fff' : '#64748b',
                        transition:'all 0.2s', borderRadius:8
                      }}>{v === 'jour' ? 'Par Jour' : 'Par Mois'}</button>
                    ))}
                  </div>
                  <button onClick={exportTarif} style={{ background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', padding:'5px 12px', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer' }}>
                    📥 CSV
                  </button>
                </div>
              }
            >
              <p style={{ margin:'0 0 14px', fontSize:12, color:'#64748b' }}>
                Somme des km_tsp (kilomètres facturés) — proxy du tarif transport {view === 'jour' ? 'par journée' : 'par mois'}.
              </p>

              <div style={{ display:'flex', gap:16, marginBottom:14, flexWrap:'wrap' }}>
                <div style={{ background:'linear-gradient(135deg,#fff7ed,#fef3c7)', border:'1px solid #fed7aa', borderRadius:12, padding:'14px 20px', flex:1, minWidth:120 }}>
                  <div style={{ fontSize:22, fontWeight:900, color:'#f97316' }}>{stats.global.totalKm.toLocaleString('fr-FR')} km</div>
                  <div style={{ fontSize:11, color:'#92400e', marginTop:4, fontWeight:600 }}>KM total cumulé</div>
                </div>
                <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #bbf7d0', borderRadius:12, padding:'14px 20px', flex:1, minWidth:120 }}>
                  <div style={{ fontSize:22, fontWeight:900, color:'#16a34a' }}>{stats.tarifParMois.filter(r=>r.km>0).length}</div>
                  <div style={{ fontSize:11, color:'#166534', marginTop:4, fontWeight:600 }}>Mois avec données KM</div>
                </div>
              </div>

              {view === 'jour' ? (
                <BarChart data={stats.tarifParJour.filter(r => r.km > 0)} labelKey="jour" valueKey="km" color="#f97316" height={150} formatValue={v => `${v}km`} />
              ) : (
                <BarChart data={stats.tarifParMois.filter(r => r.km > 0)} labelKey="mois" valueKey="km" color="#06b6d4" height={150} formatValue={v => `${v}km`} />
              )}

              {/* Table */}
              <div style={{ overflowX:'auto', marginTop:16 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <thead>
                    <tr style={{ background:'linear-gradient(180deg, #f8fafc, #f1f5f9)' }}>
                      {['Période','KM Total','Tendance'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:700, color:'#475569', borderBottom:'1px solid #e5e7eb', letterSpacing:'0.04em', textTransform:'uppercase', fontSize:11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(view==='jour' ? stats.tarifParJour : stats.tarifParMois).slice(0,12).map((r,i,arr) => {
                      const prev = arr[i-1]?.km ?? r.km
                      const trend = r.km > prev ? '↑' : r.km < prev ? '↓' : '→'
                      const trendColor = r.km > prev ? '#16a34a' : r.km < prev ? '#dc2626' : '#64748b'
                      return (
                        <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='#f8fafc'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'8px 12px', fontWeight:600, color:'#374151' }}>{view==='jour' ? r.jour : r.mois}</td>
                          <td style={{ padding:'8px 12px' }}>
                            <span style={{ fontWeight:800, color:'#f97316' }}>{Number(r.km).toLocaleString('fr-FR')}</span>
                            <span style={{ color:'#94a3b8', fontSize:11, marginLeft:4 }}>km</span>
                          </td>
                          <td style={{ padding:'8px 12px', fontWeight:800, color:trendColor, fontSize:16 }}>{trend}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </section>
  )
}