import React, { useState, useEffect, useCallback } from 'react'
import { apiUrl } from '../utils/apiBase'

/* ── Severity Colors ──────────────────────────────────────────────── */
const RISK_COLORS = {
  critical: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', glow: '#ef4444' },
  high:     { bg: '#fff7ed', border: '#fdba74', text: '#ea580c', glow: '#f97316' },
  medium:   { bg: '#fefce8', border: '#fde047', text: '#ca8a04', glow: '#eab308' },
  low:      { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', glow: '#22c55e' },
}

const RISK_LABELS = { critical: 'Critique', high: 'Élevé', medium: 'Moyen', low: 'Faible' }

/* ── Risk Gauge SVG ───────────────────────────────────────────────── */
function RiskGauge({ score, size = 70 }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const level = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low'
  const color = RISK_COLORS[level]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ai-risk-gauge">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color.glow} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 4px ${color.glow}40)` }}
      />
      <text x={size/2} y={size/2 - 4} textAnchor="middle" fill={color.text}
        style={{ fontSize: size * 0.28, fontWeight: 800 }}>{score}</text>
      <text x={size/2} y={size/2 + 12} textAnchor="middle" fill="#94a3b8"
        style={{ fontSize: size * 0.14, fontWeight: 600 }}>RISK</text>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   AI DASHBOARD PAGE — Predictions + Anomaly Analysis + Route Optimizer
   ═══════════════════════════════════════════════════════════════════ */
export default function AiDashboardPage({ theme }) {
  const dk = (d, l) => theme === 'dark' ? d : l

  const [activeSection, setActiveSection] = useState('predictions')
  const [predictions, setPredictions] = useState([])
  const [predLoading, setPredLoading] = useState(false)
  const [driverFilter, setDriverFilter] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState(null)

  // Route optimizer state
  const [depotCode, setDepotCode] = useState('')
  const [clientCodesInput, setClientCodesInput] = useState('')
  const [routeResult, setRouteResult] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState('')

  // Extract unique driver names for filter dropdown
  const uniqueDrivers = [...new Set(predictions.map(p => (p.driver || '').trim()).filter(Boolean))].sort()
  const filteredPredictions = driverFilter
    ? predictions.filter(p => (p.driver || '').trim() === driverFilter)
    : predictions

  /* ── Predictions ──────────────────────────────────────────────── */
  const loadPredictions = useCallback(async () => {
    setPredLoading(true)
    try {
      const res = await fetch(apiUrl('/api/ai/predictions'))
      if (res.ok) {
        const data = await res.json()
        setPredictions(Array.isArray(data) ? data : [])
      }
    } catch (e) { console.error('Prediction error:', e) }
    finally { setPredLoading(false) }
  }, [])

  useEffect(() => {
    if (activeSection === 'predictions') loadPredictions()
  }, [activeSection, loadPredictions])

  /* ── Analysis ─────────────────────────────────────────────────── */
  const runAnalysis = async () => {
    setAnalysisLoading(true)
    setAnalysis(null)
    try {
      const res = await fetch(apiUrl('/api/ai/analyze-anomalies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
      })
      if (res.ok) setAnalysis(await res.json())
    } catch (e) { console.error('Analysis error:', e) }
    finally { setAnalysisLoading(false) }
  }

  const sendEmail = async () => {
    setEmailSending(true)
    setEmailResult(null)
    try {
      const res = await fetch(apiUrl('/api/ai/send-anomaly-report'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
      })
      setEmailResult(await res.json())
    } catch { setEmailResult({ email: { sent: false } }) }
    finally { setEmailSending(false) }
  }

  /* ── Route Optimizer ──────────────────────────────────────────── */
  const optimizeRoute = async () => {
    setRouteLoading(true)
    setRouteError('')
    setRouteResult(null)
    try {
      const codes = clientCodesInput.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
      if (!depotCode.trim() || codes.length < 2) {
        setRouteError('Entrez un dépôt et au moins 2 codes clients.')
        return
      }
      const res = await fetch(apiUrl('/api/ai/optimize-route'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depotCode: depotCode.trim(), clientCodes: codes }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setRouteError(data.message || data.error || 'Erreur serveur')
        return
      }
      setRouteResult(data)
    } catch (e) { setRouteError('Erreur réseau: ' + e.message) }
    finally { setRouteLoading(false) }
  }

  /* ═════════════════════ RENDER ═════════════════════════════════ */
  const sections = [
    { id: 'predictions', label: '📈 Prédictions', icon: '📈' },
    { id: 'analysis', label: '🔍 Analyse IA', icon: '🔍' },
    { id: 'optimizer', label: '🗺️ Optimisation', icon: '🗺️' },
  ]

  return (
    <section className={`content ai-dashboard ${dk('ai-dark', 'ai-light')}`}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="ai-page-header">
        <div className="ai-page-header-left">
          <div className="ai-page-header-icon">🤖</div>
          <div>
            <h1 className="ai-page-title">Intelligence Artificielle</h1>
            <p className="ai-page-subtitle">Prédictions, Analyse & Optimisation alimentées par Gemini AI</p>
          </div>
        </div>
        <div className="ai-page-header-badge">
          <span className="ai-status-dot" />
          Gemini Connected
        </div>
      </div>

      {/* ── Section Tabs ───────────────────────────────────────── */}
      <div className="ai-section-tabs">
        {sections.map(s => (
          <button key={s.id}
            className={`ai-section-tab ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── PREDICTIONS ────────────────────────────────────────── */}
      {activeSection === 'predictions' && (
        <div className="ai-section">
          <div className="ai-section-header">
            <h2>📈 Prédiction de Retards & Anomalies</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {uniqueDrivers.length > 0 && (
                <select
                  className="ai-driver-filter"
                  value={driverFilter}
                  onChange={e => setDriverFilter(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #475569',
                    background: dk('#1e293b', '#fff'),
                    color: dk('#e2e8f0', '#1e293b'),
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    minWidth: '200px',
                  }}
                >
                  <option value="">👤 Tous les chauffeurs ({uniqueDrivers.length})</option>
                  {uniqueDrivers.map(d => (
                    <option key={d} value={d}>👤 {d}</option>
                  ))}
                </select>
              )}
              <button className="ai-btn ai-btn-primary" onClick={loadPredictions} disabled={predLoading}>
                {predLoading ? '⏳ Analyse...' : '🔄 Analyser'}
              </button>
            </div>
          </div>

          {predLoading && (
            <div className="ai-loading">
              <div className="ai-spinner" />
              <span>Analyse des données historiques avec Gemini AI...</span>
            </div>
          )}

          {!predLoading && predictions.length === 0 && (
            <div className="ai-empty">
              <div className="ai-empty-icon">📊</div>
              <p>Aucune prédiction disponible. Cliquez "Analyser" pour démarrer.</p>
            </div>
          )}

          {!predLoading && filteredPredictions.length === 0 && predictions.length > 0 && (
            <div className="ai-empty">
              <div className="ai-empty-icon">🔍</div>
              <p>Aucune prédiction pour ce chauffeur. <button onClick={() => setDriverFilter('')} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Voir tous</button></p>
            </div>
          )}

          <div className="ai-predictions-grid">
            {filteredPredictions.map((p, i) => {
              const colors = RISK_COLORS[p.riskLevel] || RISK_COLORS.low
              return (
                <div key={i} className="ai-prediction-card" style={{
                  borderColor: colors.border,
                  background: dk(`${colors.bg}10`, colors.bg),
                }}>
                  <div className="ai-pred-top">
                    <RiskGauge score={p.riskScore} />
                    <div className="ai-pred-info">
                      <div className="ai-pred-id">{p.wms || p.tourneeId}</div>
                      <div className="ai-pred-meta">
                        <span>🚛 {p.truck || '—'}</span>
                        <span>👤 {p.driver || '—'}</span>
                        <span>📅 {p.date || '—'}</span>
                      </div>
                      <div className="ai-pred-risk" style={{ color: colors.text }}>
                        {RISK_LABELS[p.riskLevel] || p.riskLevel}
                        {p.predictedDelayMin > 0 && <span> · +{p.predictedDelayMin} min retard</span>}
                      </div>
                    </div>
                  </div>

                  {p.factors && p.factors.length > 0 && (
                    <div className="ai-pred-factors">
                      {p.factors.map((f, fi) => (
                        <div key={fi} className={`ai-pred-factor ${f.impact}`}>
                          <span className="ai-pred-factor-icon">{f.impact === 'negative' ? '⚠️' : '✅'}</span>
                          <span>{f.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {p.recommendations && p.recommendations.length > 0 && (
                    <div className="ai-pred-recs">
                      <div className="ai-pred-recs-title">💡 Recommandations:</div>
                      {p.recommendations.map((r, ri) => (
                        <div key={ri} className="ai-pred-rec">• {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ANALYSIS ───────────────────────────────────────────── */}
      {activeSection === 'analysis' && (
        <div className="ai-section">
          <div className="ai-section-header">
            <h2>🔍 Analyse des Tournées Non Conformes</h2>
            <div className="ai-date-filters">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="ai-date-input" />
              <span>→</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="ai-date-input" />
              <button className="ai-btn ai-btn-primary" onClick={runAnalysis} disabled={analysisLoading}>
                {analysisLoading ? '⏳ Analyse...' : '🔍 Analyser'}
              </button>
              <button className="ai-btn ai-btn-email" onClick={sendEmail} disabled={emailSending || analysisLoading}
                title="Configuration SMTP requise pour envoyer par email">
                {emailSending ? '⏳ Envoi...' : '📧 Envoyer Rapport'}
              </button>
            </div>
          </div>

          {emailResult && (
            <div className={`ai-email-result ${emailResult.email?.sent ? 'success' : 'error'}`}>
              {emailResult.email?.sent
                ? `✅ Rapport envoyé à ${emailResult.email.to}`
                : `⚠️ Envoi email indisponible — Configurez SMTP_HOST, SMTP_USER et SMTP_PASS dans le fichier .env du backend.`}
            </div>
          )}

          {analysisLoading && (
            <div className="ai-loading">
              <div className="ai-spinner" />
              <span>Gemini AI analyse les anomalies...</span>
            </div>
          )}

          {analysis && (
            <div className="ai-analysis-results">
              <div className="ai-analysis-summary">
                <div className="ai-analysis-summary-icon">📊</div>
                <div>
                  <div className="ai-analysis-summary-count">{analysis.totalNonConforme} anomalies</div>
                  <div className="ai-analysis-summary-period">Période: {analysis.period}</div>
                  <div className="ai-analysis-summary-text">{analysis.summary}</div>
                </div>
              </div>

              {/* Root Causes */}
              {analysis.rootCauses && analysis.rootCauses.length > 0 && (
                <div className="ai-analysis-block">
                  <h3>🔍 Causes Principales</h3>
                  <div className="ai-causes-grid">
                    {analysis.rootCauses.map((c, i) => (
                      <div key={i} className={`ai-cause-card ai-severity-${c.severity}`}>
                        <div className="ai-cause-header">
                          <span className="ai-cause-category">{c.category}</span>
                          <span className="ai-cause-count">{c.count}</span>
                        </div>
                        <div className="ai-cause-desc">{c.description}</div>
                        <div className={`ai-cause-severity ${c.severity}`}>
                          {c.severity === 'critical' ? '🔴' : c.severity === 'high' ? '🟠' : c.severity === 'medium' ? '🟡' : '🟢'} {c.severity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="ai-analysis-block">
                  <h3>💡 Recommandations</h3>
                  <div className="ai-recs-list">
                    {analysis.recommendations.map((r, i) => (
                      <div key={i} className="ai-rec-item">
                        <div className="ai-rec-priority">#{r.priority}</div>
                        <div className="ai-rec-content">
                          <div className="ai-rec-action">{r.action}</div>
                          <div className="ai-rec-impact">📈 {r.expectedImpact}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Patterns */}
              {analysis.patterns && analysis.patterns.length > 0 && (
                <div className="ai-analysis-block">
                  <h3>📊 Patterns Identifiés</h3>
                  <div className="ai-patterns-list">
                    {analysis.patterns.map((p, i) => (
                      <div key={i} className="ai-pattern-item">
                        <div className="ai-pattern-name">{p.pattern}</div>
                        <div className="ai-pattern-count">{p.affectedTournees} tournées</div>
                        <div className="ai-pattern-detail">{p.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ROUTE OPTIMIZER ────────────────────────────────────── */}
      {activeSection === 'optimizer' && (
        <div className="ai-section">
          <div className="ai-section-header">
            <h2>🗺️ Optimisation d'Itinéraires (TSP)</h2>
          </div>

          <div className="ai-optimizer-form">
            <div className="ai-opt-field">
              <label>Code Dépôt (origine)</label>
              <input type="text" value={depotCode} onChange={e => setDepotCode(e.target.value)}
                placeholder="Ex: AZI, NAD, BAR..." className="ai-opt-input" />
            </div>
            <div className="ai-opt-field">
              <label>Codes Clients (séparés par virgule)</label>
              <textarea value={clientCodesInput} onChange={e => setClientCodesInput(e.target.value)}
                placeholder="Entrez les codes dépôts/clients de votre base (ex: AZI, NAD, BAR)" className="ai-opt-textarea" rows={3} />
            </div>
            <button className="ai-btn ai-btn-primary" onClick={optimizeRoute} disabled={routeLoading}>
              {routeLoading ? '⏳ Optimisation...' : '🚀 Optimiser l\'itinéraire'}
            </button>
            {routeError && <div className="ai-error">{routeError}</div>}
          </div>

          {routeResult && (
            <div className="ai-route-result">
              {/* Savings Banner */}
              <div className="ai-savings-banner">
                <div className="ai-savings-item">
                  <div className="ai-savings-value">{routeResult.savingsKm} km</div>
                  <div className="ai-savings-label">Distance économisée</div>
                </div>
                <div className="ai-savings-item">
                  <div className="ai-savings-value">{routeResult.savingsPct}%</div>
                  <div className="ai-savings-label">Réduction</div>
                </div>
                <div className="ai-savings-item">
                  <div className="ai-savings-value">{routeResult.estimatedTimeSavedMin} min</div>
                  <div className="ai-savings-label">Temps économisé</div>
                </div>
              </div>

              {/* Before/After */}
              <div className="ai-route-compare">
                <div className="ai-route-col">
                  <div className="ai-route-col-title">
                    <span className="ai-route-badge original">Ordre Original</span>
                    <span className="ai-route-km">{routeResult.originalDistanceKm} km</span>
                  </div>
                  <div className="ai-route-stops">
                    {routeResult.originalOrder.map((code, i) => (
                      <div key={i} className="ai-route-stop">
                        <span className="ai-route-stop-num">{i + 1}</span>
                        <span className="ai-route-stop-code">{code}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ai-route-arrow">➤</div>

                <div className="ai-route-col">
                  <div className="ai-route-col-title">
                    <span className="ai-route-badge optimized">Ordre Optimisé</span>
                    <span className="ai-route-km ai-route-km--better">{routeResult.optimizedDistanceKm} km</span>
                  </div>
                  <div className="ai-route-stops">
                    {routeResult.optimizedOrder.map((code, i) => (
                      <div key={i} className="ai-route-stop optimized">
                        <span className="ai-route-stop-num">{i + 1}</span>
                        <span className="ai-route-stop-code">{code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legs detail */}
              <div className="ai-route-legs">
                <h3>Détail des tronçons optimisés</h3>
                <table className="ai-legs-table">
                  <thead>
                    <tr><th>#</th><th>De</th><th>Vers</th><th>Distance</th></tr>
                  </thead>
                  <tbody>
                    {routeResult.legs.map((leg, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td className="ai-leg-code">{leg.from}</td>
                        <td className="ai-leg-code">{leg.to}</td>
                        <td>{leg.distanceKm} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
