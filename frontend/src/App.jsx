import React, { useEffect, useState, useCallback, useRef } from 'react'
import './App.css'

import { apiUrl } from './utils/apiBase'
import { appendClientRowIfNotDuplicate, mergeLoadedFormWithItem } from './utils/tourneeClientRow'
import { useTmsData } from './hooks/UseTmsData'
import { useAlerts } from './hooks/useAlerts'
import LoginScreen       from './components/loginScreen'
import Sidebar           from './components/Sidebar'
import TourneePage       from './pages/TourneePage'
import DashboardPage     from './pages/DashboardPage'
import ConfrontationPage from './pages/Confrontationpage'
import SimulateurPage    from './pages/Simulateurpage'
import AdminPage         from './pages/AdminPage'
import GpsPage           from './pages/GpsPage'

const TOURNEE_TABS = ['AZIZA', 'DIVERS', 'GIAS', 'FLEG']

const EMPTY_ROW = () => ({
  id: Date.now(), client: '', dep: '', um: '', pal: '',
  arrivee: '', depart: '', kmArv: '', taxe: '',
  livree: false, kmTh: '', region: ''
})

export default function App() {
  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]             = useState('AZIZA')
  const [isLoggedIn, setIsLoggedIn]           = useState(false)
  const [userRole, setUserRole]               = useState(null)
  const [loginForm, setLoginForm]             = useState({ username: '', password: '' })
  const [showTourneeMenu, setShowTourneeMenu] = useState(false)
  const [sidebarWidth, setSidebarWidth]       = useState(280)
  const [theme, setTheme]                     = useState('dark')

  // ── Form / table state ──────────────────────────────────────────────────────
  const [tableRows, setTableRows]           = useState([EMPTY_ROW()])
  const [formData, setFormData]             = useState({})
  const [selectedTmsId, setSelectedTmsId]   = useState(null)
  const [selectedTmsItem, setSelectedTmsItem] = useState(null)
  const [loadingDetail, setLoadingDetail]   = useState(false)

  // ── TMS data (fetch + filter) ────────────────────────────────────────────────
  const { tms, list, filteredList, tmsFilters, setTmsFilters, activeFilterChips, clearFilters } = useTmsData()
  const { alerts, refetch: refetchAlerts, forTournee } = useAlerts({ pollMs: 120_000 })

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const isResizing = useRef(false)
  const menuRef    = useRef(null)

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedItem       = selectedTmsItem ?? (selectedTmsId ? list.find((x) => x?.id === selectedTmsId) : null)
  const hasSelectedTournee = Boolean(selectedItem)

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowTourneeMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Sidebar resize ────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (isResizing.current && e.clientX >= 100) setSidebarWidth(e.clientX)
  }, [])

  const handleMouseUp = useCallback(function onMouseUp() {
    isResizing.current = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }, [handleMouseMove])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isResizing.current = true
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove, handleMouseUp])

  // ── Sidebar row click → load form data from Nest API + client row / autofill ─
  const handleSelectItem = useCallback(async (item) => {
    if (!item) return
    setSelectedTmsId(item.id)
    setSelectedTmsItem(item)
    setLoadingDetail(true)

    // Switch to Tournée tab automatically
    if (!TOURNEE_TABS.includes(activeTab)) setActiveTab('AZIZA')

    try {
      const res = await fetch(apiUrl(`/api/tms/form-data/${encodeURIComponent(item.id)}`))
      const data = await res.json()
      const fd = data.formData ?? data.input_data

      const rowsFromApi = data.tableRows ?? data.table_rows
      const baseRows = rowsFromApi?.length > 0 ? rowsFromApi : [EMPTY_ROW()]

      if (fd && typeof fd === 'object') {
        const formObj = {
          date:            fd.date            ?? item.date        ?? '',
          wms:             fd.wms             ?? item.wms         ?? '',
          prestation:      fd.prestation      ?? item.prestation  ?? '',
          truck:           fd.truck           ?? item.truck       ?? '',
          driver:          fd.driver          ?? item.driver      ?? '',
          dep:             fd.dep             ?? item.dep         ?? '',
          kmFacture:       fd.kmFacture       ?? '',
          marchandise:     fd.marchandise     ?? '',
          conformite:      fd.conformite      ?? 'Conforme',
          observation:     fd.observation     ?? '',
          hDepart:         fd.hDepart         ?? '',
          kmDepart:        fd.kmDepart        ?? '',
          hRetour:         fd.hRetour         ?? '',
          kmRetour:        fd.kmRetour        ?? '',
          kmDernierClient: fd.kmDernierClient ?? '',
          kmMoy:           fd.kmMoy           ?? '',
          totalPalettes:   fd.totalPalettes   ?? '0',
          tourneeSec:      fd.tourneeSec      ?? '0',
          apresMidi:       fd.apresMidi       ?? false,
          interSite:       fd.interSite       ?? false,
          gpsStartLat:     fd.gpsStartLat     ?? '',
          gpsStartLng:     fd.gpsStartLng     ?? '',
          gpsEndLat:       fd.gpsEndLat       ?? '',
          gpsEndLng:       fd.gpsEndLng       ?? '',
          gpsStartLabel:   fd.gpsStartLabel   ?? '',
          gpsEndLabel:     fd.gpsEndLabel     ?? '',
        }
        setFormData(mergeLoadedFormWithItem(formObj, item))
      } else {
        setFormData(
          mergeLoadedFormWithItem(
            {
              date: item.date ?? '',
              wms: item.wms ?? '',
              prestation: item.prestation ?? '',
              truck: item.truck ?? '',
              driver: item.driver ?? '',
              dep: item.dep ?? '',
              kmFacture: '',
              marchandise: '',
              conformite: 'Conforme',
              observation: '',
              hDepart: '',
              kmDepart: '',
              hRetour: '',
              kmRetour: '',
              kmDernierClient: '',
              kmMoy: '',
              totalPalettes: '0',
              tourneeSec: '0',
              apresMidi: false,
              interSite: false,
              gpsStartLat: '',
              gpsStartLng: '',
              gpsEndLat: '',
              gpsEndLng: '',
              gpsStartLabel: '',
              gpsEndLabel: '',
            },
            item,
          ),
        )
      }

      setTableRows(appendClientRowIfNotDuplicate(baseRows, item))
    } catch (e) {
      console.error('Erreur chargement tournée:', e)
      const fallbackForm = mergeLoadedFormWithItem(
        {
          date: item.date ?? '',
          wms: item.wms ?? '',
          prestation: item.prestation ?? '',
          truck: item.truck ?? '',
          driver: item.driver ?? '',
          dep: item.dep ?? '',
          kmFacture: '',
          marchandise: '',
          conformite: 'Conforme',
          observation: '',
          hDepart: '',
          kmDepart: '',
          hRetour: '',
          kmRetour: '',
          kmDernierClient: '',
          kmMoy: '',
          totalPalettes: '0',
          tourneeSec: '0',
          apresMidi: false,
          interSite: false,
          gpsStartLat: '',
          gpsStartLng: '',
          gpsEndLat: '',
          gpsEndLng: '',
          gpsStartLabel: '',
          gpsEndLabel: '',
        },
        item,
      )
      setFormData(fallbackForm)
      setTableRows(appendClientRowIfNotDuplicate([EMPTY_ROW()], item))
    } finally {
      setLoadingDetail(false)
    }
  }, [activeTab])

  // ── Table row helpers ─────────────────────────────────────────────────────────
  const updateClientRow = useCallback((index, field, value) => {
    setTableRows(prev => {
      const rows = [...prev]
      rows[index] = { ...rows[index], [field]: value }
      return rows
    })
  }, [])

  // ── DELETE row ────────────────────────────────────────────────────────────────
  const deleteClientRow = useCallback((index) => {
    setTableRows(prev => prev.filter((_, i) => i !== index))
  }, [])

  // ── Save form ─────────────────────────────────────────────────────────────────
  const handleSaveForm = async () => {
    if (!selectedItem?.id) return
    try {
      const res = await fetch(apiUrl(`/api/tms/form-data/${encodeURIComponent(selectedItem.id)}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: formData, table_rows: tableRows }),
      })
      if (res.ok) refetchAlerts?.()
      if (res.ok) {
        alert('✅ Données enregistrées avec succès !')
        return
      }

      let details = ''
      try {
        const ct = res.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const j = await res.json()
          details = j?.message ? String(j.message) : JSON.stringify(j)
        } else {
          details = await res.text()
        }
      } catch {
        // ignore parse errors
      }

      console.error('Save failed:', { status: res.status, statusText: res.statusText, details })
      alert(`❌ Erreur lors de l'enregistrement. (${res.status} ${res.statusText})${details ? `\n${details}` : ''}`)
    } catch {
      alert('❌ Erreur de réseau.')
    }
  }

  const handleFormChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={`app-root ${theme}-theme`}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#f97316', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', marginRight: '4px' }}>
              <div style={{ width: '4px', height: '12px', background: '#4b5563' }} />
              <div style={{ width: '4px', height: '16px', background: '#fff' }} />
              <div style={{ width: '4px', height: '20px', background: '#4b5563' }} />
            </div>
            <span style={{ fontWeight: '900', color: '#374151', fontSize: '22px', letterSpacing: '-1px', fontStyle: 'italic' }}>LUMIERE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#f97316', letterSpacing: '1px', lineHeight: '1' }}>LOGISTIQUE</span>
          </div>
        </div>

        <nav className="topnav">
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              className={'topnav-item' + (TOURNEE_TABS.includes(activeTab) ? ' topnav-item--active' : '')}
              onClick={() => setShowTourneeMenu(!showTourneeMenu)}
            >
              🚚 TOURNÉES
            </button>
            {showTourneeMenu && (
              <div style={{ position: 'absolute', top: '110%', left: 0, backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '8px', minWidth: '160px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TOURNEE_TABS.map(tab => (
                  <button key={tab}
                    style={{ padding: '10px 12px', textAlign: 'left', border: 'none', background: activeTab === tab ? '#fff7ed' : 'transparent', color: activeTab === tab ? '#f97316' : '#4b5563', fontWeight: '700', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => { setActiveTab(tab); setShowTourneeMenu(false) }}
                    onMouseEnter={(e) => { if (activeTab !== tab) e.target.style.backgroundColor = '#f9fafb' }}
                    onMouseLeave={(e) => { if (activeTab !== tab) e.target.style.backgroundColor = 'transparent' }}
                  >• {tab}</button>
                ))}
              </div>
            )}
          </div>

          {[
            { tab: 'DASHBOARD',     label: '📊 DASHBOARD' },
            { tab: 'GPS',           label: '📍 GPS' },
            { tab: 'CONFRONTATION', label: '⚖️ CONFRONTATION' },
            { tab: 'SIMULATEUR',    label: '💰 SIMULATEUR' },
          ].map(({ tab, label }) => (
            <button key={tab}
              className={'topnav-item' + (activeTab === tab ? ' topnav-item--active' : '')}
              onClick={() => setActiveTab(tab)}
            >{label}</button>
          ))}

          {userRole === 'admin' && (
            <button
              className={'topnav-item' + (activeTab === 'ADMIN' ? ' topnav-item--active' : '')}
              onClick={() => setActiveTab('ADMIN')}
            >⚙️ ADMIN</button>
          )}
        </nav>

        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ background: theme === 'dark' ? '#2a2e35' : '#f1f5f9', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e2e8f0'}`, color: theme === 'dark' ? '#e2e8f0' : '#4b5563', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', marginRight: '12px' }}
          >
            {theme === 'dark' ? '🌤️ Clair' : '🌙 Sombre'}
          </button>
          <button className="btn-logout" onClick={() => setIsLoggedIn(false)} style={{ marginLeft: '4px', backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fecaca', fontSize: '11px', padding: '6px 12px', cursor: 'pointer' }}>
            QUITTER
          </button>
        </div>
      </header>

      {/* ── Login overlay ─────────────────────────────────────────────────────── */}
      {!isLoggedIn && (
        <LoginScreen
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          onLogin={(role) => {
            setUserRole(role)
            setIsLoggedIn(true)
            if (role === 'user' && activeTab === 'ADMIN') setActiveTab('DASHBOARD')
          }}
        />
      )}

      {/* ── Main layout ───────────────────────────────────────────────────────── */}
      {isLoggedIn && (
        <main className="layout" style={{ display: 'grid', gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}>
          <Sidebar
            sidebarWidth={sidebarWidth}
            onResizeStart={handleMouseDown}
            tmsFilters={tmsFilters}
            setTmsFilters={setTmsFilters}
            filteredList={filteredList}
            list={list}
            activeFilterChips={activeFilterChips}
            clearFilters={clearFilters}
            selectedTmsId={selectedTmsId}
            onSelectItem={handleSelectItem}
          />

          {/* Loading overlay */}
          {loadingDetail && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#f97316', fontWeight: '700' }}>
              ⏳ Chargement de la tournée...
            </div>
          )}

          {/* Tournée page */}
          {!loadingDetail && TOURNEE_TABS.includes(activeTab) && (
            hasSelectedTournee ? (
              <TourneePage
                theme={theme}
                activeTab={activeTab}
                formData={formData}
                onFormChange={handleFormChange}
                tableRows={tableRows}
                onUpdateRow={updateClientRow}
                onDeleteRow={deleteClientRow}
                onSave={handleSaveForm}
                selectedTmsId={selectedTmsId}
                tourneeAlerts={forTournee(selectedTmsId)}
              />
            ) : (
              <section className="content">
                <div className="card">
                  <div style={{ fontWeight: 800, color: '#7c2d12', marginBottom: '6px' }}>Sélection requise</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Sélectionnez une tournée من القائمة على اليسار.</div>
                </div>
              </section>
            )
          )}

          {activeTab === 'DASHBOARD'     && <DashboardPage tms={tms} list={list} activeFilterChips={activeFilterChips} hasSelectedTournee={hasSelectedTournee} alerts={alerts} />}
          {activeTab === 'GPS'           && <GpsPage selectedTmsId={selectedTmsId} theme={theme} />}
          {activeTab === 'CONFRONTATION' && <ConfrontationPage alerts={alerts} refetchAlerts={refetchAlerts} />}
          {activeTab === 'SIMULATEUR'    && <SimulateurPage />}
          {activeTab === 'ADMIN'         && <AdminPage />}
        </main>
      )}
    </div>
  )
}