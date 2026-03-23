import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('AZIZA')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState(null) // 'admin' or 'user'
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [showTourneeMenu, setShowTourneeMenu] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [tms, setTms] = useState(null)
  const [tmsFilters, setTmsFilters] = useState({
    wms: '',
    tms: '',
    date: '',
    site: '',
    truck: '',
    driver: '',
    dep: '',
    prestation: '',
  })
  const [selectedTmsId, setSelectedTmsId] = useState(null)
  const [selectedTmsItem, setSelectedTmsItem] = useState(null)
  const isResizing = useRef(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowTourneeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetch('/api/tms')
      .then((res) => res.json())
      .then((json) => setTms(json))
      .catch(() => {
        setTms(null)
      })
  }, [])

  const active = tms?.active
  const list = tms?.list ?? []

  const normalizeText = (value) => (value == null ? '' : String(value)).trim().toLowerCase()

  const normalizeDateQuery = (value) => {
    const s = normalizeText(value)
    if (!s) return ''
    // Accept yyyy-mm-dd or dd/mm/yyyy
    const fr = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`
    return s
  }

  const filteredList = useMemo(() => {
    const q = {
      wms: normalizeText(tmsFilters.wms),
      tms: normalizeText(tmsFilters.tms),
      date: normalizeDateQuery(tmsFilters.date),
      site: normalizeText(tmsFilters.site),
      truck: normalizeText(tmsFilters.truck),
      driver: normalizeText(tmsFilters.driver),
      dep: normalizeText(tmsFilters.dep),
      prestation: normalizeText(tmsFilters.prestation),
    }

    const includes = (fieldValue, queryValue) => {
      if (!queryValue) return true
      return normalizeText(fieldValue).includes(queryValue)
    }

    return list.filter((item) => {
      const tmsNumber = normalizeText(item?.id).replace(/^tms-/, '')
      return (
        includes(item?.wms, q.wms) &&
        (!q.tms || tmsNumber.includes(q.tms) || normalizeText(item?.id).includes(q.tms)) &&
        includes(item?.date, q.date) &&
        includes(item?.site, q.site) &&
        includes(item?.truck, q.truck) &&
        includes(item?.driver, q.driver) &&
        includes(item?.dep, q.dep) &&
        includes(item?.prestation, q.prestation)
      )
    })
  }, [list, tmsFilters])

  const selectedItem = selectedTmsItem ?? (selectedTmsId ? list.find((x) => x?.id === selectedTmsId) : null)

  const activeFilterChips = useMemo(() => {
    const chips = []
    if (tmsFilters.wms) chips.push({ label: 'WMS', value: tmsFilters.wms })
    if (tmsFilters.tms) chips.push({ label: 'TMS', value: tmsFilters.tms })
    if (tmsFilters.date) chips.push({ label: 'Date', value: tmsFilters.date })
    if (tmsFilters.site) chips.push({ label: 'Site', value: tmsFilters.site })
    if (tmsFilters.truck) chips.push({ label: 'Camion', value: tmsFilters.truck })
    if (tmsFilters.driver) chips.push({ label: 'Chauffeur', value: tmsFilters.driver })
    if (tmsFilters.dep) chips.push({ label: 'Dep', value: tmsFilters.dep })
    if (tmsFilters.prestation) chips.push({ label: 'Prestation', value: tmsFilters.prestation })
    return chips
  }, [tmsFilters])

  const handleMouseMove = useCallback((e) => {
    if (isResizing.current) {
      const newWidth = e.clientX
      if (newWidth >= 100 && newWidth <= 600) {
        setSidebarWidth(newWidth)
      }
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isResizing.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isResizing.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove, handleMouseUp])

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            backgroundColor: '#f97316', 
            padding: '4px 8px', 
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', marginRight: '4px' }}>
              <div style={{ width: '4px', height: '12px', background: '#4b5563' }}></div>
              <div style={{ width: '4px', height: '16px', background: '#fff' }}></div>
              <div style={{ width: '4px', height: '20px', background: '#4b5563' }}></div>
            </div>
            <span style={{ 
              fontWeight: '900', 
              color: '#374151', 
              fontSize: '22px', 
              letterSpacing: '-1px',
              fontStyle: 'italic'
            }}>LUMIERE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: '900', 
              color: '#f97316', 
              letterSpacing: '1px',
              lineHeight: '1'
            }}>LOGISTIQUE</span>
          </div>
        </div>
        <nav className="topnav">
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              className={
                'topnav-item' + (['DIVERS', 'AZIZA', 'FLEG', 'GIAS'].includes(activeTab) ? ' topnav-item--active' : '')
              }
              onClick={() => setShowTourneeMenu(!showTourneeMenu)}
            >
              🚚 TOURNÉES
            </button>
            
            {showTourneeMenu && (
              <div style={{
                position: 'absolute',
                top: '110%',
                left: '0',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '8px',
                minWidth: '160px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {['AZIZA', 'DIVERS', 'FLEG', 'GIAS'].map((tab) => (
                  <button
                    key={tab}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      border: 'none',
                      background: activeTab === tab ? '#fff7ed' : 'transparent',
                      color: activeTab === tab ? '#f97316' : '#4b5563',
                      fontWeight: '700',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => {
                      setActiveTab(tab);
                      setShowTourneeMenu(false);
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab) e.target.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab) e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    • {tab}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            className={
              'topnav-item' + (activeTab === 'DASHBOARD' ? ' topnav-item--active' : '')
            }
            onClick={() => setActiveTab('DASHBOARD')}
          >
            📊 DASHBOARD
          </button>
          <button 
            className={
              'topnav-item' + (activeTab === 'CONFRONTATION' ? ' topnav-item--active' : '')
            }
            onClick={() => setActiveTab('CONFRONTATION')}
          >
            ⚖️ CONFRONTATION
          </button>
          <button 
            className={
               'topnav-item' + (activeTab === 'SIMULATEUR' ? ' topnav-item--active' : '')
            }
            onClick={() => setActiveTab('SIMULATEUR')}
          >
            💰 SIMULATEUR
          </button>
          
          {userRole === 'admin' && (
            <button 
              className={
                'topnav-item' + (activeTab === 'ADMIN' ? ' topnav-item--active' : '')
              }
              onClick={() => setActiveTab('ADMIN')}
            >
              ⚙️ ADMIN
            </button>
          )}
        </nav>
        <div className="topbar-right">
          <button 
            className="btn-logout" 
            onClick={() => setIsLoggedIn(false)}
            style={{ 
              marginLeft: '4px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              borderColor: '#fecaca',
              fontSize: '11px',
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            QUITTER
          </button>
        </div>
      </header>

      {!isLoggedIn ? (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f8fafc',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: '900', 
                color: '#4b5563', 
                fontStyle: 'italic',
                marginBottom: '5px'
              }}>
                LUMIERE <span style={{ color: '#f97316' }}>LOGISTIQUE</span>
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', letterSpacing: '2px' }}>AUTHENTIFICATION</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <button 
                  onClick={() => setLoginForm({...loginForm, username: 'admin@lumiere.fr'})}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid' + (loginForm.username === 'admin@lumiere.fr' ? '#f97316' : '#e5e7eb'),
                    backgroundColor: loginForm.username === 'admin@lumiere.fr' ? '#fff7ed' : 'white',
                    color: loginForm.username === 'admin@lumiere.fr' ? '#f97316' : '#64748b',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🔐</span>
                  ADMIN
                </button>
                <button 
                  onClick={() => setLoginForm({...loginForm, username: 'user@lumiere.fr'})}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '2px solid' + (loginForm.username === 'user@lumiere.fr' ? '#f97316' : '#e5e7eb'),
                    backgroundColor: loginForm.username === 'user@lumiere.fr' ? '#fff7ed' : 'white',
                    color: loginForm.username === 'user@lumiere.fr' ? '#f97316' : '#64748b',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>👤</span>
                  USER
                </button>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  color: '#64748b', 
                  display: 'block', 
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>IDENTIFIANT / EMAIL</label>
                <div style={{ 
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#fff'
                }}>
                  <span style={{ marginRight: '10px', color: '#94a3b8' }}>👤</span>
                  <input 
                    type="text" 
                    placeholder="admin@lumiere.fr" 
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                    style={{ 
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      width: '100%',
                      color: '#475569'
                    }}
                  />
                </div>
              </div>

              <input 
                type="password" 
                placeholder="Mot de passe" 
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
              <button 
                onClick={() => {
                  if (loginForm.username.includes('admin')) {
                    setUserRole('admin');
                    setIsLoggedIn(true);
                  } else if (loginForm.username.includes('user')) {
                    setUserRole('user');
                    setIsLoggedIn(true);
                    if (activeTab === 'ADMIN') setActiveTab('DASHBOARD');
                  } else {
                    alert('Veuillez sélectionner un profil ou entrer un email valide');
                  }
                }}
                style={{ 
                  backgroundColor: '#f97316', 
                  color: 'white', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '10px',
                  boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.2)'
                }}
              >
                SE CONNECTER
              </button>
            </div>
          </div>
        </div>
      ) : (
        <main className="layout" style={{ display: 'grid', gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}>
          <aside className="sidebar" style={{ width: `${sidebarWidth}px`, padding: '16px', overflowY: 'auto' }}>
          <div className="sidebar-resizer" onMouseDown={handleMouseDown} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h1 className="sidebar-title" style={{ margin: 0 }}>TOURNÉES DISPONIBLES</h1>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '800', 
              color: '#fff', 
              background: '#f97316', 
              padding: '2px 8px', 
              borderRadius: '4px',
              textTransform: 'uppercase'
            }}>
              {filteredList.length} / {list.length} TOURNÉES
            </span>
          </div>

          <div className="sidebar-search-grid">
            <input
              type="text"
              placeholder="N° WMS"
              className="search-field"
              value={tmsFilters.wms}
              onChange={(e) => setTmsFilters({ ...tmsFilters, wms: e.target.value })}
            />
            <input
              type="text"
              placeholder="N° TMS"
              className="search-field"
              value={tmsFilters.tms}
              onChange={(e) => setTmsFilters({ ...tmsFilters, tms: e.target.value })}
            />
            <input
              type="text"
              placeholder="Date"
              className="search-field"
              value={tmsFilters.date}
              onChange={(e) => setTmsFilters({ ...tmsFilters, date: e.target.value })}
            />
            <input
              type="text"
              placeholder="Site"
              className="search-field"
              value={tmsFilters.site}
              onChange={(e) => setTmsFilters({ ...tmsFilters, site: e.target.value })}
            />
            <input
              type="text"
              placeholder="Camion"
              className="search-field"
              value={tmsFilters.truck}
              onChange={(e) => setTmsFilters({ ...tmsFilters, truck: e.target.value })}
            />
            <input
              type="text"
              placeholder="Chauffeur"
              className="search-field"
              value={tmsFilters.driver}
              onChange={(e) => setTmsFilters({ ...tmsFilters, driver: e.target.value })}
            />
            <input
              type="text"
              placeholder="Dep"
              className="search-field"
              value={tmsFilters.dep}
              onChange={(e) => setTmsFilters({ ...tmsFilters, dep: e.target.value })}
            />
            <input
              type="text"
              placeholder="Prestation"
              className="search-field"
              value={tmsFilters.prestation}
              onChange={(e) => setTmsFilters({ ...tmsFilters, prestation: e.target.value })}
            />
          </div>

          <div className="filter-bar">
            <div className="filter-chips">
              {activeFilterChips.length === 0 ? (
                <span className="filter-empty">Aucun filtre actif</span>
              ) : (
                activeFilterChips.map((chip) => (
                  <span key={`${chip.label}-${chip.value}`} className="filter-chip">
                    {chip.label}: {chip.value}
                  </span>
                ))
              )}
            </div>
            <button
              className="filter-clear"
              onClick={() => setTmsFilters({ wms: '', tms: '', date: '', site: '', truck: '', driver: '', dep: '', prestation: '' })}
              disabled={activeFilterChips.length === 0}
            >
              Effacer
            </button>
          </div>

          <table className="sidebar-tms-table">
            <thead>
              <tr>
                <th>
                  <div className="th-label">OTSNUMBDX</div>
                  <div className="th-meta">(WMS)</div>
                </th>
                <th>
                  <div className="th-label">OTDCODE / OTSNUM</div>
                  <div className="th-meta">(TMS)</div>
                </th>
                <th>
                  <div className="th-label">CDATE</div>
                  <div className="th-meta">(Date)</div>
                </th>
                <th>
                  <div className="th-label">SITCODE</div>
                  <div className="th-meta">(Site)</div>
                </th>
                <th>
                  <div className="th-label">VOYCLE</div>
                  <div className="th-meta">(Camion)</div>
                </th>
                <th>
                  <div className="th-label">SALNOM</div>
                  <div className="th-meta">(Chauffeur)</div>
                </th>
                <th>
                  <div className="th-label">TOUTRAFCODE</div>
                  <div className="th-meta">(Dep)</div>
                </th>
                <th>
                  <div className="th-label">PLALIB / ARTCODE</div>
                  <div className="th-meta">(Prestation)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length > 0 ? filteredList.map((item) => (
                <tr 
                  key={item.id}
                  className={item?.id === selectedTmsId ? 'active-row' : ''}
                  onClick={() => {
                    setSelectedTmsId(item?.id ?? null)
                    setSelectedTmsItem(item ?? null)
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{item.wms || '---'}</td>
                  <td>{String(item.id ?? '').replace('tms-', '') || '---'}</td>
                  <td>{item.date || '---'}</td>
                  <td>{item.site || '---'}</td>
                  <td>{item.truck || '---'}</td>
                  <td>{(item.driver ? String(item.driver).split(' ')[0] : '---')}</td>
                  <td>{item.dep || '120'}</td>
                  <td>{item.prestation || 'STK'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Aucune donnée</td>
                </tr>
              )}
            </tbody>
          </table>
        </aside>

        {activeTab === 'AZIZA' && (
          <section className="content">
            <div className="card tms-detail-card">
              <div className="detail-header">
                <div>
                  <h3 className="detail-title">Données TMS sélectionnées</h3>
                  <p className="detail-subtitle">Champs alignés avec les colonnes Excel</p>
                </div>
                <span className="detail-badge">Admin</span>
              </div>
              <div className="detail-grid">
                <div>
                  <div className="detail-label">N° TMS <span>(OTDCODE / OTSNUM)</span></div>
                  <div className="detail-value">{selectedItem ? String(selectedItem.id).replace('tms-', '') : '--'}</div>
                </div>
                <div>
                  <div className="detail-label">N° WMS <span>(OTSNUMBDX)</span></div>
                  <div className="detail-value">{selectedItem?.wms || '--'}</div>
                </div>
                <div>
                  <div className="detail-label">Date <span>(CDATE)</span></div>
                  <div className="detail-value">{selectedItem?.date || '--'}</div>
                </div>
                <div>
                  <div className="detail-label">Site <span>(SITCODE)</span></div>
                  <div className="detail-value">{selectedItem?.site || '--'}</div>
                </div>
                <div>
                  <div className="detail-label">Camion <span>(VOYCLE)</span></div>
                  <div className="detail-value">{selectedItem?.truck || '--'}</div>
                </div>
                <div>
                  <div className="detail-label">Chauffeur <span>(SALNOM)</span></div>
                  <div className="detail-value">{selectedItem?.driver || '--'}</div>
                </div>
                <div>
                  <div className="detail-label">Dep <span>(TOUTRAFCODE)</span></div>
                  <div className="detail-value">{selectedItem?.dep || '--'}</div>
                </div>
                <div>
                  <div className="detail-label">Prestation <span>(PLALIB / ARTCODE)</span></div>
                  <div className="detail-value">{selectedItem?.prestation || '--'}</div>
                </div>
              </div>
            </div>
            {/* SECTION 1: Header Info */}
            <div className="card divers-card">
              <div className="card-top-accent"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Numero</th>
                    <th>Camion</th>
                    <th>Chauffeur</th>
                    <th>Tournée générique</th>
                    <th>KM facture</th>
                    <th>Marchandise</th>
                    <th>Conformite</th>
                    <th>Observation:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td contentEditable suppressContentEditableWarning>{selectedItem?.date || '--/--/----'}</td>
                    <td contentEditable suppressContentEditableWarning>{(selectedItem?.id ? String(selectedItem.id).replace('tms-', '') : '--')}</td>
                    <td contentEditable suppressContentEditableWarning>{selectedItem?.truck || '--'}</td>
                    <td contentEditable suppressContentEditableWarning>{selectedItem?.driver || '--'}</td>
                    <td contentEditable suppressContentEditableWarning>{selectedItem?.dep || '--'}</td>
                    <td contentEditable suppressContentEditableWarning>{selectedItem?.wms || '--'}</td>
                    <td contentEditable suppressContentEditableWarning>{selectedItem?.prestation || '--'}</td>
                    <td>
                      <select className="table-select" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '11px', outline: 'none' }}>
                        <option>Conforme</option>
                        <option>Non Conforme</option>
                        <option>Absence BL</option>
                        <option>Absence cachet et Signature ( Décharge)</option>
                        <option>Kilométrage erronée</option>
                        <option>Nombre de palette non conforme</option>
                        <option>Retard communication dérogation</option>
                        <option>Retard envoie document</option>
                        <option>Livraison effectuée</option>
                        <option>Livraison non effectuée</option>
                        <option>Autres</option>
                      </select>
                    </td>
                    <td contentEditable suppressContentEditableWarning>--</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 2: Depot Info */}
            <div className="card divers-card mt-sm">
              <div className="card-top-accent card-top-accent--gold"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>H.départ depot</th>
                    <th>H.retour depot</th>
                    <th>Km.Départ depot</th>
                    <th>Km.Retour depot</th>
                    <th>Km/Moy.</th>
                    <th>Km dernier client:</th>
                    <th>N° prestation</th>
                    <th>Total palette:</th>
                    <th>Apres midi</th>
                    <th>Tournée secondaire</th>
                    <th>Tournée inter site:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Array(11).fill(0).map((_, i) => (
                      <td key={i} contentEditable onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 3: Client Info */}
            <div className="card divers-card mt-sm">
              <div className="card-top-accent card-top-accent--green"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Dep</th>
                    <th>UM</th>
                    <th>Pal</th>
                    <th>Arrivé.Client</th>
                    <th>Départ.Client</th>
                    <th>Km.Arv.Client</th>
                    <th>Taxe</th>
                    <th>Livrée</th>
                    <th>Retard</th>
                    <th>Penalité</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((row) => (
                    <tr 
                      key={row} 
                      className="dynamic-row"
                      onInput={(e) => {
                        const tr = e.target.closest('tr');
                        const hasContent = Array.from(tr.cells).some(td => td.innerText.trim() !== '');
                        if (hasContent) tr.classList.add('has-data');
                        else tr.classList.remove('has-data');
                      }}
                    >
                      {Array(11).fill(0).map((_, i) => (
                        <td 
                          key={i} 
                          contentEditable 
                          onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} 
                          onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}
                        ></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-outline px-6 py-2 rounded-lg border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-all">ANNULER</button>
              <button className="btn-primary px-8 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all">ENREGISTRER LA TOURNÉE</button>
            </div>
          </section>
        )}

        {activeTab === 'DIVERS' && (
          <section className="content">
            {/* SECTION 1: Header Info */}
            <div className="card divers-card">
              <div className="card-top-accent"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Numero</th>
                    <th>Camion</th>
                    <th>Chauffeur</th>
                    <th>Depart</th>
                    <th>Arrivee</th>
                    <th>Client</th>
                    <th>Marchandise</th>
                    <th>Observation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Array(9).fill(0).map((_, i) => (
                      <td key={i} contentEditable onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 2: Depot Info */}
            <div className="card divers-card mt-sm">
              <div className="card-top-accent card-top-accent--gold"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>H.départ depot</th>
                    <th>H.retour depot</th>
                    <th>Km.Départ depot</th>
                    <th>Km.Retour depot</th>
                    <th>N° prestation</th>
                    <th>Total palette</th>
                    <th>Tarif</th>
                    <th>Remise</th>
                    <th>Km parcouru</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Array(9).fill(0).map((_, i) => (
                      <td key={i} contentEditable onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 3: Client Info */}
            <div className="card divers-card mt-sm">
              <div className="card-top-accent card-top-accent--green"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Client</th>
                    <th>Hr.Arrivé</th>
                    <th>Hr.Départ</th>
                    <th>Km.Arrv.Client</th>
                    <th>Commentaire</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((row) => (
                    <tr 
                      key={row} 
                      className="dynamic-row"
                      onInput={(e) => {
                        const tr = e.target.closest('tr');
                        const hasContent = Array.from(tr.cells).some(td => td.innerText.trim() !== '');
                        if (hasContent) tr.classList.add('has-data');
                        else tr.classList.remove('has-data');
                      }}
                    >
                      {Array(5).fill(0).map((_, i) => (
                        <td 
                          key={i} 
                          contentEditable 
                          onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} 
                          onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}
                        ></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-outline px-6 py-2 rounded-lg border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-all">ANNULER</button>
              <button className="btn-primary px-8 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all">ENREGISTRER LA TOURNÉE</button>
            </div>
          </section>
        )}

        {activeTab === 'FLEG' && (
          <section className="content">
            {/* SECTION 1: Header Info */}
            <div className="card divers-card">
              <div className="card-top-accent"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Numero</th>
                    <th>Camion</th>
                    <th>Chauffeur</th>
                    <th>Tournée générique</th>
                    <th>KM facture</th>
                    <th>Marchandise</th>
                    <th>Conformite</th>
                    <th>Observation:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td contentEditable>--/--/----</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td>
                      <select className="table-select" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '11px', outline: 'none' }}>
                        <option>Conforme</option>
                        <option>Non Conforme</option>
                        <option>Absence BL</option>
                        <option>Absence cachet et Signature ( Décharge)</option>
                        <option>Kilométrage erronée</option>
                        <option>Nombre de palette non conforme</option>
                        <option>Retard communication dérogation</option>
                        <option>Retard envoie document</option>
                        <option>Livraison effectuée</option>
                        <option>Livraison non effectuée</option>
                        <option>Autres</option>
                      </select>
                    </td>
                    <td contentEditable>--</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 2: Depot Info */}
            <div className="card divers-card mt-sm">
              <div className="card-top-accent card-top-accent--gold"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>H.départ depot</th>
                    <th>H.retour depot</th>
                    <th>Km.Départ depot</th>
                    <th>Km.Retour depot</th>
                    <th>Km/Moy.</th>
                    <th>Km dernier client:</th>
                    <th>N° prestation</th>
                    <th>Total palette:</th>
                    <th>Apres midi</th>
                    <th>Tournée secondaire</th>
                    <th>Tournée inter site:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Array(11).fill(0).map((_, i) => (
                      <td key={i} contentEditable onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 3: Client Info */}
            <div className="card divers-card mt-sm">
              <div className="card-top-accent card-top-accent--green"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Dep</th>
                    <th>UM</th>
                    <th>Pal</th>
                    <th>Arrivé.Client</th>
                    <th>Départ.Client</th>
                    <th>Km.Arv.Client</th>
                    <th>Taxe</th>
                    <th>Livrée</th>
                    <th>Retard</th>
                    <th>Penalité</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((row) => (
                    <tr 
                      key={row} 
                      className="dynamic-row"
                      onInput={(e) => {
                        const tr = e.target.closest('tr');
                        const hasContent = Array.from(tr.cells).some(td => td.innerText.trim() !== '');
                        if (hasContent) tr.classList.add('has-data');
                        else tr.classList.remove('has-data');
                      }}
                    >
                      {Array(11).fill(0).map((_, i) => (
                        <td 
                          key={i} 
                          contentEditable 
                          onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} 
                          onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}
                        ></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-outline px-6 py-2 rounded-lg border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-all">ANNULER</button>
              <button className="btn-primary px-8 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all">ENREGISTRER LA TOURNÉE</button>
            </div>
          </section>
        )}

        {activeTab === 'GIAS' && (
          <section className="content">
            {/* SECTION 1: Header Info */}
            <div className="card divers-card">
              <div className="card-top-accent"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Numero</th>
                    <th>Camion</th>
                    <th>Chauffeur</th>
                    <th>Tournée générique</th>
                    <th>KM facture</th>
                    <th>Marchandise</th>
                    <th>Conformite</th>
                    <th>Observation:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td contentEditable>--/--/----</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td contentEditable>--</td>
                    <td>
                      <select className="table-select" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '11px', outline: 'none' }}>
                        <option>Conforme</option>
                        <option>Non Conforme</option>
                        <option>Absence BL</option>
                        <option>Absence cachet et Signature ( Décharge)</option>
                        <option>Kilométrage erronée</option>
                        <option>Nombre de palette non conforme</option>
                        <option>Retard communication dérogation</option>
                        <option>Retard envoie document</option>
                        <option>Livraison effectuée</option>
                        <option>Livraison non effectuée</option>
                        <option>Autres</option>
                      </select>
                    </td>
                    <td contentEditable>--</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 2: Depot Info */}
            <div className="card divers-card mt-sm">
              <div className="card-top-accent card-top-accent--gold"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>H.départ depot</th>
                    <th>H.retour depot</th>
                    <th>Km.Départ depot</th>
                    <th>Km.Retour depot</th>
                    <th>Km/Moy.</th>
                    <th>Km dernier client:</th>
                    <th>N° prestation</th>
                    <th>Total palette:</th>
                    <th>Apres midi</th>
                    <th>Tournée secondaire</th>
                    <th>Tournée inter site:</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {Array(11).fill(0).map((_, i) => (
                      <td key={i} contentEditable onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* SECTION 3: Client Info */}
            <div className="card divers-card mt-sm">
              <div className="card-top-accent card-top-accent--green"></div>
              <table className="divers-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Dep</th>
                    <th>UM</th>
                    <th>Pal</th>
                    <th>Arrivé.Client</th>
                    <th>Départ.Client</th>
                    <th>Km.Arv.Client</th>
                    <th>Taxe</th>
                    <th>Livrée</th>
                    <th>Retard</th>
                    <th>Penalité</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map((row) => (
                    <tr 
                      key={row} 
                      className="dynamic-row"
                      onInput={(e) => {
                        const tr = e.target.closest('tr');
                        const hasContent = Array.from(tr.cells).some(td => td.innerText.trim() !== '');
                        if (hasContent) tr.classList.add('has-data');
                        else tr.classList.remove('has-data');
                      }}
                    >
                      {Array(11).fill(0).map((_, i) => (
                        <td 
                          key={i} 
                          contentEditable 
                          onFocus={(e) => e.target.closest('tr').classList.add('row-focus')} 
                          onBlur={(e) => e.target.closest('tr').classList.remove('row-focus')}
                        ></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn-outline px-6 py-2 rounded-lg border-2 border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-all">ANNULER</button>
              <button className="btn-primary px-8 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all">ENREGISTRER LA TOURNÉE</button>
            </div>
          </section>
        )}

        {activeTab === 'CONFRONTATION' && (
          <section className="content">
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <div style={{ fontSize: '30px', backgroundColor: '#fff7ed', padding: '10px', borderRadius: '12px' }}>⚖️</div>
                <div>
                  <h2 className="title-orange" style={{ margin: 0 }}>CONFRONTATION DES DONNÉES</h2>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Comparaison entre TMS et Facturation</p>
                </div>
              </div>
              
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

              <div style={{ 
                marginTop: '25px', 
                padding: '15px', 
                backgroundColor: '#fef2f2', 
                border: '1px solid #fee2e2', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span style={{ color: '#991b1b', fontWeight: 600 }}>Écart détecté : -70,00 DT sur 1 dossier(s)</span>
                <button style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>VOIR DÉTAILS</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'SIMULATEUR' && (
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
        )}

        {activeTab === 'ADMIN' && (
          <section className="content">
            <div className="card" style={{ padding: '30px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                backgroundColor: '#fef3c7', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 20px',
                fontSize: '40px'
              }}>
                ⚙️
              </div>
              <h2 className="title-orange" style={{ fontSize: '24px', marginBottom: '10px' }}>PANNEAU D'ADMINISTRATION</h2>
              <p style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto 30px' }}>
                Bienvenue dans l'interface de gestion. Ici vous pouvez configurer les accès utilisateurs, les sites logistiques et les paramètres système.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>👥</div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Utilisateurs</h4>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Gérer les permissions</span>
                </div>
                <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>🏢</div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Sites</h4>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Ajouter/Modifier sites</span>
                </div>
                <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Logs</h4>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Historique système</span>
                </div>
                <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>🛠️</div>
                  <h4 style={{ margin: '0 0 5px 0' }}>Paramètres</h4>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Config. générale</span>
                </div>
              </div>
            </div>
          </section>
        )}

        </main>
      )}
    </div>
  )
}

export default App
