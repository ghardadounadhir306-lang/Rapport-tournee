import React from 'react'

export default function SimulateurPage() {
  return (
    <section className="content">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <div style={{ fontSize: '30px', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '12px' }}>💰</div>
          <div>
            <h2 className="title-orange" style={{ margin: 0 }}>SIMULATEUR DE FACTURATION</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Estimation des coûts de transport</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '30px' }}>
          <div className="search-field-group">
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>TYPE CAMION</label>
            <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
              <option>Semi-remorque</option>
              <option>Porteur 12T</option>
              <option>Camionnette</option>
            </select>
          </div>
          <div className="search-field-group">
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>DISTANCE (KM)</label>
            <input type="number" placeholder="Ex: 250" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>
          <div className="search-field-group">
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '5px' }}>NB POINTS D'ARRÊT</label>
            <input type="number" placeholder="Ex: 5" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-primary" style={{ width: '100%', height: '42px' }}>CALCULER</button>
          </div>
        </div>

        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '15px', borderBottom: '1px solid #e5e7eb', fontWeight: 700 }}>RÉSULTAT DE LA SIMULATION</div>
          <div style={{ padding: '30px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Estimation du coût total</div>
            <div style={{ fontSize: '42px', fontWeight: 800, color: '#f97316' }}>0,00 DT</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>* Basé sur les tarifs contractuels en vigueur</div>
          </div>
        </div>
      </div>
    </section>
  )
}