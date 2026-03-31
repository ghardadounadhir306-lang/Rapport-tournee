import React from 'react'

export default function ConfrontationPage({ alerts = [], refetchAlerts }) {
  const bloquants = alerts.filter((a) => a.severity === 'BLOQUANT')
  const autres = alerts.filter((a) => a.severity !== 'BLOQUANT')

  return (
    <section className="content">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '30px', backgroundColor: '#fff7ed', padding: '10px', borderRadius: '12px' }}>⚖️</div>
          <div>
            <h2 className="title-orange" style={{ margin: 0 }}>CONFRONTATION DES DONNÉES</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Comparaison entre TMS, GPS et contrôles opérationnels</p>
          </div>
          {refetchAlerts && (
            <button
              type="button"
              onClick={() => refetchAlerts()}
              style={{ marginLeft: 'auto', padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', fontWeight: 600 }}
            >
              Actualiser alertes
            </button>
          )}
        </div>

        {alerts.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: '#1e293b', marginTop: 0 }}>Alertes opérationnelles ({alerts.length})</h4>
            {bloquants.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>Bloquants</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                  {bloquants.map((a, i) => (
                    <li key={`b-${i}`} style={{ marginBottom: 6 }}>
                      <code style={{ fontSize: 11, color: '#64748b' }}>{a.code}</code> — {a.message}
                      {a.tmsFormId ? <span style={{ color: '#f97316', marginLeft: 6 }}>({a.tmsFormId})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {autres.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, color: '#c2410c', marginBottom: 8 }}>Infos & alertes</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                  {autres.map((a, i) => (
                    <li key={`a-${i}`} style={{ marginBottom: 6 }}>
                      <code style={{ fontSize: 11, color: '#64748b' }}>{a.code}</code> — {a.message}
                      {a.tmsFormId ? <span style={{ color: '#f97316', marginLeft: 6 }}>({a.tmsFormId})</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-2" style={{ gap: '20px' }}>
          <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f8fafc' }}>
            <h4 style={{ color: '#1e293b', marginTop: 0 }}>📊 Données TMS</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #cbd5e1' }}>
              <span>Nombre de Tournées</span>
              <span style={{ fontWeight: 700 }}>45</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span>Montant Total HT</span>
              <span style={{ fontWeight: 700, color: '#f97316' }}>12 450,00 DT</span>
            </div>
          </div>

          <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#f8fafc' }}>
            <h4 style={{ color: '#1e293b', marginTop: 0 }}>🧾 Données Facturation</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #cbd5e1' }}>
              <span>Nombre de Factures</span>
              <span style={{ fontWeight: 700 }}>44</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
              <span>Montant Total HT</span>
              <span style={{ fontWeight: 700, color: '#f97316' }}>12 380,00 DT</span>
            </div>
          </div>
        </div>

        {alerts.length === 0 && (
          <div style={{
            marginTop: '25px', padding: '15px',
            backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <span style={{ color: '#166534', fontWeight: 600 }}>Aucune alerte opérationnelle détectée sur les données chargées.</span>
          </div>
        )}
      </div>
    </section>
  )
}