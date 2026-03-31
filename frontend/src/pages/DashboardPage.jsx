import React, { useEffect, useState } from 'react'
import { apiUrl } from '../utils/apiBase'

export default function DashboardPage({ tms, list, activeFilterChips, hasSelectedTournee, alerts = [] }) {
  const alertCount = alerts.filter((a) => a.severity === 'ALERTE' || a.severity === 'BLOQUANT').length
  const [transportRows, setTransportRows] = useState([])
  const [transportLoading, setTransportLoading] = useState(true)
  const [transportError, setTransportError] = useState('')

  useEffect(() => {
    let mounted = true
    setTransportLoading(true)
    setTransportError('')
    fetch(apiUrl('/api/tms/transport-data?limit=50'))
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) {
          const msg = typeof json?.message === 'string' ? json.message : 'Erreur chargement transport_data'
          throw new Error(msg)
        }
        return json
      })
      .then((json) => {
        if (!mounted) return
        setTransportRows(Array.isArray(json?.rows) ? json.rows : [])
      })
      .catch((err) => {
        if (!mounted) return
        setTransportRows([])
        setTransportError(err?.message || 'Erreur chargement transport_data')
      })
      .finally(() => {
        if (mounted) setTransportLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const stats = [
    { label: 'Total Tournées',    value: tms?.entriesCount ?? '—', icon: '🚚', color: '#f97316' },
    { label: 'Tournées Affichées',value: list.length,              icon: '📋', color: '#3b82f6' },
    { label: 'Filtres Actifs',    value: activeFilterChips.length, icon: '🔍', color: '#8b5cf6' },
    { label: 'Sélectionnées',     value: hasSelectedTournee ? 1 : 0, icon: '✅', color: '#10b981' },
    { label: 'Alertes actives',   value: alertCount,               icon: '⚠️', color: alertCount ? '#dc2626' : '#10b981' },
  ]

  return (
    <section className="content">
      <div className="card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <div style={{ fontSize: '30px', backgroundColor: '#fff7ed', padding: '10px', borderRadius: '12px' }}>📊</div>
          <div>
            <h2 className="title-orange" style={{ margin: 0 }}>TABLEAU DE BORD</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Vue d'ensemble des tournées</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f8fafc', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent tournées table */}
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '15px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#1e293b' }}>
            DERNIÈRES TOURNÉES IMPORTÉES
          </div>
          {list.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Aucune donnée disponible. Importez un fichier Excel via l'API.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9' }}>
                  {['TMS','WMS','Date','Chauffeur','Camion','Site','Prestation'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 10).map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#f97316' }}>{String(item.id).replace('tms-', '')}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{item.wms || '---'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{item.date || '---'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{item.driver || '---'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{item.truck || '---'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{item.site || '---'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{item.prestation || '---'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', marginTop: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '15px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: '#1e293b' }}>
            DONNÉES TRANSPORT_DATA (POSTGRES)
          </div>
          {transportLoading ? (
            <div style={{ padding: '24px', color: '#64748b', fontSize: '13px' }}>Chargement...</div>
          ) : transportError ? (
            <div style={{ padding: '24px', color: '#dc2626', fontSize: '13px' }}>{transportError}</div>
          ) : transportRows.length === 0 ? (
            <div style={{ padding: '24px', color: '#94a3b8', fontSize: '13px' }}>La table transport_data est vide.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    {Object.keys(transportRows[0]).map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '700', color: '#475569', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transportRows.map((row, rowIndex) => (
                    <tr key={row.id ?? rowIndex} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {Object.keys(transportRows[0]).map((col) => (
                        <td key={`${rowIndex}-${col}`} style={{ padding: '10px 14px', color: '#374151', verticalAlign: 'top' }}>
                          {row?.[col] == null ? '---' : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}