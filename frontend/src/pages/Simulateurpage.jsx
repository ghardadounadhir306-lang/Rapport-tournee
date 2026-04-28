import React, { useEffect, useMemo, useState } from 'react'
import { useCalculateTarif } from '../hooks/useCalculateTarif'
import { tarifApi } from '../services/tarifApi'

const labelStyle = {
  fontSize: '11px',
  fontWeight: 700,
  color: '#64748b',
  display: 'block',
  marginBottom: '6px',
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  outline: 'none',
}

const panelStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
  background: '#ffffff',
}

function formatMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '0,00 DT'
  return `${num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DT`
}

function tabButtonStyle(tab, activeTab) {
  const isActive = tab === activeTab
  const colorMap = {
    aziza: { active: '#2563eb', bg: '#eff6ff' },
    fleg: { active: '#16a34a', bg: '#ecfdf5' },
    divers: { active: '#7c3aed', bg: '#f5f3ff' },
  }
  const palette = colorMap[tab]

  return {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '8px',
    border: isActive ? `1px solid ${palette.active}` : '1px solid #d1d5db',
    background: isActive ? palette.bg : '#fff',
    color: isActive ? palette.active : '#475569',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
}

function buildStoreRow(index, tab) {
  return {
    name: tab === 'fleg' ? `Magasin ${index + 1}` : '',
    palettes: '',
    time: '00:00',
  }
}

function buildMerchandiseRow() {
  return {
    codeArticle: '',
    palettes: '',
    vehicule: 'cargo',
  }
}

export default function SimulateurPage() {
  const { calculate, result, error: apiError, loading, setError: setApiError, setResult } = useCalculateTarif()
  const [formError, setFormError] = useState('')

  const [activeTab, setActiveTab] = useState('aziza')

  const [km, setKm] = useState('')
  const [palettes, setPalettes] = useState('')
  const [nbMagasins, setNbMagasins] = useState('')
  const [nature, setNature] = useState('Sec')
  const [tourneeType, setTourneeType] = useState('Generique')
  const [deliveryTime, setDeliveryTime] = useState('16:00')

  const [vehicleType, setVehicleType] = useState('dmax')
  const [zone, setZone] = useState('TUN')

  const [diversCategory, setDiversCategory] = useState('')
  const [diversSubCategory, setDiversSubCategory] = useState('')
  const [diversVehicule, setDiversVehicule] = useState('')
  const [surAchatVehicleType, setSurAchatVehicleType] = useState('cargo')
  const [nbVehicules, setNbVehicules] = useState('')
  const [isReturnTrip, setIsReturnTrip] = useState(false)
  const [hasReturnedGoods, setHasReturnedGoods] = useState(false)
  const [isSousseOctBar, setIsSousseOctBar] = useState(false)
  const [isSousseOctMhamdiya, setIsSousseOctMhamdiya] = useState(false)
  const [nbCargo, setNbCargo] = useState(1)
  const [destination, setDestination] = useState('')
  const [industriesSite, setIndustriesSite] = useState('')
  const [isSameDepartureAndReturn, setIsSameDepartureAndReturn] = useState(false)
  const [surgelaOption, setSurgelaOption] = useState('mghiraa')
  const [tarifAnexe, setTarifAnexe] = useState('')

  const [stores, setStores] = useState([])
  const [merchandises, setMerchandises] = useState([buildMerchandiseRow()])
  const [availableStores, setAvailableStores] = useState([])

  const currentError = formError || apiError

  useEffect(() => {
    let disposed = false

    const loadStores = async () => {
      try {
        const data = await tarifApi.getStores()
        if (!disposed) {
          setAvailableStores(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!disposed) {
          setAvailableStores([])
        }
      }
    }

    loadStores()
    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    if (diversCategory === 'vielavieGlace' && surgelaOption === 'mghiraa') {
      setDiversVehicule('cargo')
    }
  }, [diversCategory, surgelaOption])

  useEffect(() => {
    if (diversCategory !== 'vielavieGlace') return

    const allowed = surgelaOption === 'mghiraa' ? new Set(['cargo']) : new Set(['cargo', 'NKR', 'NPR'])
    if (!allowed.has(diversVehicule)) {
      setDiversVehicule('cargo')
    }
  }, [diversCategory, surgelaOption, diversVehicule])

  const needsNbVehicules =
    diversCategory === 'industriesEtCsm' ||
    diversCategory === 'clientDivers' ||
    (diversCategory === 'vielavieGlace' && surgelaOption === 'mghiraa') ||
    diversSubCategory === 'transfertTechnique' ||
    diversSubCategory === 'transportSurAchat' ||
    diversSubCategory === 'transportSurgele' ||
    diversSubCategory === 'transfertLilas'

  const totalDisplay = useMemo(() => {
    if (!result) return '0,00 DT'
    const value = result.total ?? result.tarifRaw ?? 0
    return formatMoney(value)
  }, [result])

  const tarifUnitDisplay = useMemo(() => {
    if (!result) return '0,00'
    const value = Number(result.tarifUnit)
    if (!Number.isFinite(value)) return '0,00'
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }, [result])

  const updateStoreCount = (count, tab) => {
    setStores((prev) => {
      const next = [...prev]
      if (count > next.length) {
        for (let i = next.length; i < count; i += 1) {
          next.push(buildStoreRow(i, tab))
        }
      }
      return next.slice(0, count)
    })
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setFormError('')
    setApiError('')

    if (tab === 'fleg') {
      setNature('Fleg')
      updateStoreCount(Number(nbMagasins) || 0, 'fleg')
      return
    }

    if (tab === 'divers') {
      setNature('Divers')
      setNbMagasins('')
      setStores([])
      return
    }

    setNature('Sec')
    updateStoreCount(Number(nbMagasins) || 0, 'aziza')
  }

  const handleChangeStoreCount = (value) => {
    const count = value === '' ? '' : Math.max(0, Number(value))
    setNbMagasins(count)
    updateStoreCount(Number(count) || 0, activeTab)
  }

  const updateStore = (index, key, value) => {
    setStores((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  const updateMerchandise = (index, key, value) => {
    setMerchandises((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [key]: value }
      return next
    })
  }

  const addMerchandise = () => {
    setMerchandises((prev) => [...prev, buildMerchandiseRow()])
  }

  const removeMerchandise = (index) => {
    setMerchandises((prev) => {
      if (prev.length <= 1) return [buildMerchandiseRow()]
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setApiError('')
    setResult(null)

    const kmNum = Number(km)
    if (!Number.isFinite(kmNum) || kmNum <= 0) {
      setFormError('Distance invalide')
      return
    }

    if (activeTab === 'divers' && !diversCategory) {
      setFormError('Sélectionnez une catégorie Divers')
      return
    }

    const storesPayload = stores.map((s, index) => ({
      name: String(s.name || `Magasin ${index + 1}`).trim(),
      palettes: Number(s.palettes) || 0,
      time: String(s.time || '00:00'),
    }))

    const totalPalettesFromStores = storesPayload.reduce((sum, s) => sum + (Number(s.palettes) || 0), 0)
    const totalPalettesFromMerchandise = merchandises.reduce((sum, m) => sum + (Number(m.palettes) || 0), 0)

    const payload = {
      km: kmNum,
      palettes: Math.min(Number(palettes) || 0, 22),
      nbMagasins: Number(nbMagasins) || 0,
      nature,
      tourneeType,
      deliveryTime,
      stores: storesPayload,
    }

    if (activeTab === 'fleg') {
      payload.vehicleType = vehicleType
      payload.zone = zone
    }

    if (activeTab === 'divers') {
      payload.diversCategory = diversCategory
      payload.diversSubCategory = diversSubCategory || undefined
      payload.vehicule = diversVehicule || undefined
      payload.vehicleType = diversSubCategory === 'transportSurAchat' ? surAchatVehicleType : undefined
      payload.nbCargo = diversSubCategory === 'transfertInterDepotSpot' ? Number(nbCargo) : undefined
      payload.besoin = needsNbVehicules ? Number(nbVehicules) || 0 : undefined
      payload.isReturnTrip = isReturnTrip
      payload.hasReturnedGoods = hasReturnedGoods
      payload.tarifAnexe = tarifAnexe === '' ? undefined : Number(tarifAnexe)
      payload.isSousseOctBar = isSousseOctBar
      payload.isSousseOctMhamdiya = isSousseOctMhamdiya
      payload.destination =
        diversCategory === 'industriesEtCsm'
          ? industriesSite
          : diversCategory === 'clientDivers'
            ? undefined
            : destination
      payload.isSameDepartureAndReturn = isSameDepartureAndReturn
      payload.surgelaOption = surgelaOption
      payload.zone = zone
      payload.merchandises = merchandises.map((m) => ({
        codeArticle: String(m.codeArticle || '').trim(),
        nbPalettes: Number(m.palettes) || 0,
        vehicule: String(m.vehicule || 'cargo').trim(),
      }))
    }

    if (activeTab !== 'divers' && totalPalettesFromStores > 0) {
      payload.palettes = Math.min(totalPalettesFromStores, 22)
    }
    if (activeTab === 'divers' && totalPalettesFromMerchandise > 0) {
      payload.palettes = Math.min(totalPalettesFromMerchandise, 22)
    }

    if (activeTab !== 'divers' && payload.stores.length === 0) {
      payload.stores = [{ name: 'Magasin 1', palettes: Number(payload.palettes) || 0, time: '00:00' }]
    }

    await calculate(payload)
  }

  return (
    <section className="content">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <div style={{ fontSize: '30px', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '12px' }}>💰</div>
          <div>
            <h2 className="title-orange" style={{ margin: 0 }}>SIMULATEUR DE FACTURATION</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Calcul avancé des coûts Aziza, Fleg et Divers</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <button type="button" style={tabButtonStyle('aziza', activeTab)} onClick={() => handleTabChange('aziza')}>AZIZA</button>
          <button type="button" style={tabButtonStyle('fleg', activeTab)} onClick={() => handleTabChange('fleg')}>FLEG</button>
          <button type="button" style={tabButtonStyle('divers', activeTab)} onClick={() => handleTabChange('divers')}>DIVERS</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>DISTANCE (KM)</label>
              <input type="number" min="1" value={km} onChange={(e) => setKm(e.target.value)} style={inputStyle} required />
            </div>

            {(activeTab === 'aziza' || activeTab === 'divers') && (
              <div>
                <label style={labelStyle}>NOMBRE PALETTES</label>
                <input type="number" min="0" max="22" value={palettes} onChange={(e) => setPalettes(e.target.value)} style={inputStyle} />
              </div>
            )}

            {(activeTab === 'aziza' || activeTab === 'fleg') && (
              <div>
                <label style={labelStyle}>NOMBRE DE MAGASINS</label>
                <input
                  type="number"
                  min="0"
                  value={nbMagasins}
                  onChange={(e) => handleChangeStoreCount(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            {activeTab === 'aziza' && (
              <>
                <div>
                  <label style={labelStyle}>NATURE PRODUIT</label>
                  <select value={nature} onChange={(e) => setNature(e.target.value)} style={inputStyle}>
                    <option value="Sec">Sec</option>
                    <option value="Froid">Froid</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>TYPE TOURNÉE</label>
                  <select value={tourneeType} onChange={(e) => setTourneeType(e.target.value)} style={inputStyle}>
                    <option value="Generique">Générique</option>
                    <option value="Non Generique">Non Générique</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>HEURE LIVRAISON</label>
                  <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} style={inputStyle} />
                </div>
              </>
            )}

            {activeTab === 'fleg' && (
              <>
                <div>
                  <label style={labelStyle}>TYPE VÉHICULE</label>
                  <select value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={inputStyle}>
                    <option value="dmax">Dmax</option>
                    <option value="nkr">NKR</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>ZONE</label>
                  <select value={zone} onChange={(e) => setZone(e.target.value)} style={inputStyle}>
                    <option value="TUN">Tunis</option>
                    <option value="BIZ">Bizerte</option>
                    <option value="CAP">Cap Bon</option>
                    <option value="SAH">Sahel</option>
                    <option value="SFAX">Sfax</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {activeTab === 'divers' && (
            <div style={{ ...panelStyle, padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>CATÉGORIE</label>
                  <select
                    value={diversCategory}
                    onChange={(e) => {
                      setDiversCategory(e.target.value)
                      setDiversSubCategory('')
                    }}
                    style={inputStyle}
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="diversAziza">Divers Aziza</option>
                    <option value="industriesEtCsm">Industries et CSM (trp23)</option>
                    <option value="clientDivers">Client Divers</option>
                    <option value="vielavieGlace">Vielavie Glace (trp4)</option>
                    <option value="surgele">Surgelé (trp8)</option>
                  </select>
                </div>

                {diversCategory === 'diversAziza' && (
                  <div>
                    <label style={labelStyle}>SOUS-CATÉGORIE</label>
                    <select value={diversSubCategory} onChange={(e) => setDiversSubCategory(e.target.value)} style={inputStyle}>
                      <option value="">-- Sélectionner --</option>
                      <option value="transfertInterMagazin">Transfert Inter Magasin (trp16)</option>
                      <option value="transfertTechnique">Transfert Technique (trp14)</option>
                      <option value="transfertRetour">Transfert Retour (trp13)</option>
                      <option value="tarifAnexe">Tarif Annexe (trp33)</option>
                      <option value="tarifOct">Tarif OCT (trp10)</option>
                      <option value="transportSurAchat">Transport sur Achat (trp6)</option>
                      <option value="transfertInterDepotSpot">Transfert Inter Dépôt Spot (trp15)</option>
                      <option value="transportSurgele">Transport Surgelé</option>
                      <option value="transfertLilas">Transfert Lilas (trp12)</option>
                    </select>
                  </div>
                )}

                {(diversCategory === 'industriesEtCsm' || diversCategory === 'clientDivers' || diversCategory === 'surgele' || diversSubCategory === 'transfertRetour') && (
                  <div>
                    <label style={labelStyle}>ZONE</label>
                    <select value={zone} onChange={(e) => setZone(e.target.value)} style={inputStyle}>
                      {diversCategory === 'clientDivers' ? (
                        <>
                          <option value="TUNIS">Tunis</option>
                          <option value="SAHEL">Sahel</option>
                          <option value="SFAX">Sfax</option>
                        </>
                      ) : diversCategory === 'surgele' ? (
                        <>
                          <option value="Zone A">Zone A</option>
                          <option value="Zone B">Zone B</option>
                          <option value="Zone C">Zone C</option>
                        </>
                      ) : diversSubCategory === 'transfertRetour' ? (
                        <>
                          <option value="Gabes et Sfax">Gabes et Sfax</option>
                          <option value="Tunis et Sahlin">Tunis et Sahlin</option>
                          <option value="Cap Bon">Cap Bon</option>
                        </>
                      ) : (
                        <>
                          <option value="TUN">Tunis</option>
                          <option value="BIZ">Bizerte</option>
                          <option value="CAP">Cap Bon</option>
                          <option value="SAH">Sahel</option>
                          <option value="SFAX">Sfax</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {(diversCategory === 'industriesEtCsm' || diversCategory === 'vielavieGlace') && (
                  <div>
                    <label style={labelStyle}>VÉHICULE</label>
                    <select
                      value={diversVehicule}
                      onChange={(e) => setDiversVehicule(e.target.value)}
                      style={inputStyle}
                      disabled={diversCategory === 'vielavieGlace' && surgelaOption === 'mghiraa'}
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="cargo">Cargo</option>
                      {diversCategory === 'vielavieGlace' && surgelaOption === 'autres' ? (
                        <>
                          <option value="NKR">NKR</option>
                          <option value="NPR">NPR</option>
                        </>
                      ) : diversCategory !== 'vielavieGlace' ? (
                        <>
                          <option value="PICUP">PICUP</option>
                          <option value="NKR">NKR</option>
                          <option value="NPR">NPR</option>
                          <option value="NPR / IVECO">NPR / IVECO</option>
                          <option value="IVECO">IVECO</option>
                          <option value="MERCEDES">MERCEDES</option>
                          <option value="SEMI">SEMI</option>
                        </>
                      ) : null}
                    </select>
                  </div>
                )}

                {diversCategory === 'vielavieGlace' && (
                  <div>
                    <label style={labelStyle}>DESTINATION / CLIENT</label>
                    <select value={surgelaOption} onChange={(e) => setSurgelaOption(e.target.value)} style={inputStyle}>
                      <option value="mghiraa">Livrée Frigos vers Mghiraa</option>
                      <option value="autres">Livrée Frigo de Mghiraa (Autres clients)</option>
                    </select>
                  </div>
                )}

                {diversCategory === 'industriesEtCsm' && (
                  <div>
                    <label style={labelStyle}>SITE INDUSTRIES</label>
                    <select value={industriesSite} onChange={(e) => setIndustriesSite(e.target.value)} style={inputStyle}>
                      <option value="">-- Sélectionner --</option>
                      <option value="Zit">Zit → Bouargoub</option>
                      <option value="Wad Lil">Wad Lil → Bouargoub</option>
                      <option value="Dandan">Dandan → Bouargoub</option>
                      <option value="Migrin">Migrin → Bouargoub</option>
                    </select>
                  </div>
                )}

                {needsNbVehicules && (
                  <div>
                    <label style={labelStyle}>NOMBRE DE VÉHICULES</label>
                    <input type="number" min="0" value={nbVehicules} onChange={(e) => setNbVehicules(e.target.value)} style={inputStyle} />
                  </div>
                )}

                {diversSubCategory === 'transportSurAchat' && (
                  <div>
                    <label style={labelStyle}>TYPE ACHAT</label>
                    <select value={surAchatVehicleType} onChange={(e) => setSurAchatVehicleType(e.target.value)} style={inputStyle}>
                      <option value="cargo">Cargo</option>
                      <option value="semi">Semi</option>
                    </select>
                  </div>
                )}

                {diversSubCategory === 'transfertInterDepotSpot' && (
                  <div>
                    <label style={labelStyle}>NOMBRE CARGO</label>
                    <input
                      type="number"
                      min="1"
                      max="2"
                      value={nbCargo}
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (Number.isFinite(v)) setNbCargo(Math.max(1, Math.min(2, v)))
                      }}
                      style={inputStyle}
                    />
                  </div>
                )}

                {diversSubCategory === 'tarifAnexe' && (
                  <div>
                    <label style={labelStyle}>TARIF ANNEXE (DT)</label>
                    <input type="number" min="0" value={tarifAnexe} onChange={(e) => setTarifAnexe(e.target.value)} style={inputStyle} />
                  </div>
                )}

                {diversSubCategory === 'tarifOct' && (
                  <div>
                    <label style={labelStyle}>TRAJET OCT</label>
                    <select
                      onChange={(e) => {
                        setIsSousseOctBar(e.target.value === 'bar')
                        setIsSousseOctMhamdiya(e.target.value === 'mhamdiya')
                      }}
                      style={inputStyle}
                    >
                      <option value="">-- Sélectionner --</option>
                      <option value="bar">Sousse vers OCT Bar</option>
                      <option value="mhamdiya">Sousse vers OCT Mhamdiya</option>
                    </select>
                  </div>
                )}

                {(diversCategory === 'clientDivers' || diversSubCategory === 'transfertInterMagazin' || diversSubCategory === 'transfertTechnique') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
                    {diversSubCategory === 'transfertInterMagazin' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                        <input type="checkbox" checked={isReturnTrip} onChange={(e) => setIsReturnTrip(e.target.checked)} />
                        Tournée globale avec tarif retour
                      </label>
                    )}
                    {diversSubCategory === 'transfertTechnique' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                        <input type="checkbox" checked={hasReturnedGoods} onChange={(e) => setHasReturnedGoods(e.target.checked)} />
                        Camion revient avec marchandise (remise 50%)
                      </label>
                    )}
                    {diversCategory === 'clientDivers' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={isSameDepartureAndReturn}
                          onChange={(e) => setIsSameDepartureAndReturn(e.target.checked)}
                        />
                        Même lieu départ/retour (remise 50%)
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {(activeTab === 'aziza' || activeTab === 'fleg') && stores.length > 0 && (
            <div style={{ ...panelStyle, marginBottom: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 800 }}>
                LISTE DES MAGASINS
              </div>
              <div style={{ padding: '12px', display: 'grid', gap: '10px' }}>
                {stores.map((store, index) => (
                  <div
                    key={`store-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: activeTab === 'aziza' ? 'minmax(220px, 2fr) minmax(130px, 1fr) minmax(130px, 1fr)' : 'minmax(220px, 2fr) minmax(130px, 1fr)',
                      gap: '8px',
                    }}
                  >
                    {activeTab === 'aziza' ? (
                      <select value={store.name} onChange={(e) => updateStore(index, 'name', e.target.value)} style={inputStyle} required>
                        <option value="">Sélectionner un magasin</option>
                        {availableStores.map((s) => (
                          <option key={s.id} value={s.name}>{s.name} ({s.sector})</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={store.name || `Magasin ${index + 1}`}
                        onChange={(e) => updateStore(index, 'name', e.target.value)}
                        style={inputStyle}
                      />
                    )}

                    {activeTab === 'aziza' && (
                      <input
                        type="time"
                        value={store.time || '00:00'}
                        onChange={(e) => updateStore(index, 'time', e.target.value)}
                        style={inputStyle}
                      />
                    )}

                    <input
                      type="number"
                      min="0"
                      placeholder="Palettes"
                      value={store.palettes}
                      onChange={(e) => updateStore(index, 'palettes', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'divers' && (
            <div style={{ ...panelStyle, marginBottom: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderBottom: '1px solid #e5e7eb', fontWeight: 800 }}>
                LISTE MARCHANDISE
              </div>
              <div style={{ padding: '12px', display: 'grid', gap: '10px' }}>
                {merchandises.map((m, index) => (
                  <div key={`merch-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 2fr) minmax(100px, 1fr) minmax(130px, 1fr) 80px', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Code article"
                      value={m.codeArticle}
                      onChange={(e) => updateMerchandise(index, 'codeArticle', e.target.value)}
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Palettes"
                      value={m.palettes}
                      onChange={(e) => updateMerchandise(index, 'palettes', e.target.value)}
                      style={inputStyle}
                    />
                    <select value={m.vehicule} onChange={(e) => updateMerchandise(index, 'vehicule', e.target.value)} style={inputStyle}>
                      <option value="cargo">Cargo</option>
                      <option value="semi">Semi</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMerchandise(index)}
                      style={{
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#dc2626',
                        fontWeight: 700,
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Retirer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMerchandise}
                  style={{
                    justifySelf: 'start',
                    border: '1px solid #c4b5fd',
                    background: '#f5f3ff',
                    color: '#6d28d9',
                    fontWeight: 700,
                    borderRadius: '8px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                  }}
                >
                  + Ajouter marchandise
                </button>
              </div>
            </div>
          )}

          {currentError ? (
            <div style={{ marginBottom: '14px', color: '#b91c1c', fontWeight: 700, fontSize: '13px' }}>{currentError}</div>
          ) : null}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', height: '44px', marginBottom: '20px', opacity: loading ? 0.8 : 1 }}
          >
            {loading ? 'CALCUL EN COURS...' : 'CALCULER'}
          </button>
        </form>

        <div style={panelStyle}>
          <div style={{ background: '#f8fafc', padding: '15px', borderBottom: '1px solid #e5e7eb', fontWeight: 700 }}>RÉSULTAT DE LA SIMULATION</div>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Estimation du coût total</div>
            <div style={{ fontSize: '42px', fontWeight: 800, color: '#f97316', marginBottom: '10px' }}>{totalDisplay}</div>

            {result ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
                textAlign: 'left',
                marginBottom: '14px',
              }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>TARIF UNITAIRE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a' }}>{tarifUnitDisplay}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>REMISE</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#b91c1c' }}>
                    {Number.isFinite(Number(result.remisePercent)) ? `${(Number(result.remisePercent) * 100).toFixed(0)}%` : '0%'}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>NB MAGASINS</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{Number(result.nbMagasins) || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>MAJORATION</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: result.hasMajoration ? '#ea580c' : '#334155' }}>
                    {result.hasMajoration ? 'ACTIVE' : 'NON'}
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px' }}>* Basé sur les tarifs contractuels en vigueur</div>

            {Array.isArray(result?.storesBreakdown) && result.storesBreakdown.length > 0 ? (
              <div style={{ marginTop: '16px', overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', borderBottom: '1px solid #e5e7eb' }}>Magasin</th>
                      <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', borderBottom: '1px solid #e5e7eb' }}>Palettes</th>
                      <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', borderBottom: '1px solid #e5e7eb' }}>Remise</th>
                      <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', borderBottom: '1px solid #e5e7eb' }}>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.storesBreakdown.map((s, idx) => (
                      <tr key={`break-${idx}`}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}>{s.name || `Magasin ${idx + 1}`}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '12px' }}>{Number(s.palettes) || 0}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '12px' }}>{formatMoney(s.remiseAmount || 0)}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontSize: '12px', fontWeight: 700 }}>{formatMoney(s.montantNet || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {result ? (
              <details style={{ marginTop: '16px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#2563eb', fontWeight: 700, fontSize: '13px' }}>Voir détail technique (JSON)</summary>
                <pre style={{ marginTop: '10px', background: '#0f172a', color: '#e2e8f0', padding: '12px', borderRadius: '8px', overflowX: 'auto', fontSize: '11px' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}