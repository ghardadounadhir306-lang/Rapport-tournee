import React from 'react'
import ParametrageCamionTab from './parametrage/ParametrageCamionTab'
import ParametrageTarifTab from './parametrage/ParametrageTarifTab'
import AjouterPoisPage from './parametrage/AjouterPoisPage'

const SECTION_HEAD = {
  ajouter_pois: { title: 'Base client POI', blurb: 'Création et modification des POI clients — enregistrement direct en base (table poi_clients).' },
  depots: { title: 'Base dépôts', blurb: 'Création et modification des dépôts — enregistrement direct dans la table depots.' },
  camion: { title: 'Base camion', blurb: 'Référentiel des véhicules (à brancher sur votre modèle de données).' },
  tarif: { title: 'Base tarif', blurb: 'Grilles tarifaires (distance / capacité, montants par date). Modèle Excel à côté d’Importer.' },
}

/**
 * Paramétrage — contenu selon l’entrée choisie dans le menu du bandeau (comme les sous-tournées).
 */
export default function ParametragePage({ theme, section = 'ajouter_pois', userDisplayName = '' }) {
  const dk = (d, l) => (theme === 'dark' ? d : l)
  const head = SECTION_HEAD[section] ?? SECTION_HEAD.ajouter_pois

  return (
    <section
      className="content"
      style={{
        padding: '16px 20px 32px',
        width: '100%',
        maxWidth: 'min(100%, 1920px)',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div className="card" style={{ marginBottom: 16, padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '30px', backgroundColor: '#fff7ed', padding: '10px', borderRadius: '12px' }}>🎛️</div>
          <div>
            <h2 className="title-orange" style={{ margin: 0 }}>PARAMÉTRAGE</h2>
            <p style={{ margin: '4px 0 0', fontWeight: 800, fontSize: '14px', color: '#f97316' }}>{head.title}</p>
            <p style={{ margin: '6px 0 0', color: dk('#94a3b8', '#64748b'), fontSize: '13px' }}>{head.blurb}</p>
          </div>
        </div>
      </div>

      {section === 'ajouter_pois' && <AjouterPoisPage theme={theme} userDisplayName={userDisplayName} mode="clients" />}
      {section === 'depots' && <AjouterPoisPage theme={theme} userDisplayName={userDisplayName} mode="depots" />}
      {section === 'camion' && <ParametrageCamionTab theme={theme} />}
      {section === 'tarif' && <ParametrageTarifTab theme={theme} userDisplayName={userDisplayName} />}
    </section>
  )
}


