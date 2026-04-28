import React, { useEffect, useState, useCallback, useRef } from 'react'
import './App.css'

import { apiUrl } from './utils/apiBase'
import { appendClientRowIfNotDuplicate, mergeLoadedFormWithItem } from './utils/tourneeClientRow'
import { applyLegKmsToRows, fetchTheoreticalKmLegs, fillMissingKmThRows } from './utils/theoreticalKm'
import { useTmsData } from './hooks/UseTmsData'
import { useAlerts } from './hooks/useAlerts'
import LoginScreen       from './components/loginScreen'
import Sidebar           from './components/Sidebar'
import TourneePage       from './pages/TourneePage'
import DashboardPage     from './pages/DashboardPage'
import ConfrontationPage from './pages/Confrontationpage'
import SimulateurPage    from './pages/Simulateurpage'
import AdminPage         from './pages/AdminPage'
import SuperAdminTripsPage from './pages/SuperAdminTripsPage'

import ParametragePage from './pages/ParametragePage'
import OptimisationPage from './pages/OptimisationPage'

const TOURNEE_TABS = ['AZIZA', 'DIVERS', 'GIAS', 'FLEG']
const SUPER_ADMIN_TAB = 'SUPER_ADMIN_TRIPS'

/** Sous-entrées Paramétrage (menu déroulant comme TOURNÉES). */
const PARAMETRAGE_TABS = ['PARAMETRAGE_AJOUTER_POIS', 'PARAMETRAGE_DEPOTS', 'PARAMETRAGE_CAMION', 'PARAMETRAGE_TARIF']
const PARAMETRAGE_MENU = [
  { tab: 'PARAMETRAGE_AJOUTER_POIS', label: 'BASE CLIENT POI' },
  { tab: 'PARAMETRAGE_DEPOTS', label: 'BASE DEPOTS' },
  { tab: 'PARAMETRAGE_CAMION', label: 'BASE CAMION' },
  { tab: 'PARAMETRAGE_TARIF', label: 'BASE TARIF' },
]

const EMPTY_ROW = () => ({
  id: Date.now(), client: '', dep: '', um: '', pal: '',
  arrivee: '', depart: '', kmArv: '', taxe: '',
  livree: false, kmTh: '', region: ''
})

export default function App() {
  // ── UI state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]             = useState('AZIZA')
  const [isLoggedIn, setIsLoggedIn]           = useState(false)
  const [clientNameByCode, setClientNameByCode] = useState({})
  const [userRole, setUserRole]               = useState(null)
  const [userDisplayName, setUserDisplayName] = useState('')
  const [allowedPages, setAllowedPages]       = useState(['TOURNEES', 'DASHBOARD'])
  const [loginForm, setLoginForm]             = useState({ username: '', password: '' })
  const [showTourneeMenu, setShowTourneeMenu] = useState(false)
  const [showParametrageMenu, setShowParametrageMenu] = useState(false)
  const [sidebarWidth, setSidebarWidth]       = useState(280)
  const [theme, setTheme]                     = useState('light')

  // ── Form / table state ──────────────────────────────────────────────────────
  const [tableRows, setTableRows]           = useState([EMPTY_ROW()])
  const [formData, setFormData]             = useState({})
  const [selectedTmsId, setSelectedTmsId]   = useState(null)
  const [selectedTmsItem, setSelectedTmsItem] = useState(null)
  const [loadingDetail, setLoadingDetail]   = useState(false)
  // Background loading — details fetched AFTER form is shown (non-blocking)
  const [detailEnriching, setDetailEnriching] = useState(false)

  // ── TMS data (fetch + filter) ────────────────────────────────────────────────
  const { tms, list, filteredList, tmsFilters, setTmsFilters, activeFilterChips, clearFilters } = useTmsData()
  const { alerts, refetch: refetchAlerts, forTournee } = useAlerts({ pollMs: 120_000 })

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const isResizing = useRef(false)
  const menuRef         = useRef(null)
  const paramMenuRef    = useRef(null)

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedItem       = selectedTmsItem ?? (selectedTmsId ? list.find((x) => x?.id === selectedTmsId) : null)
  const hasSelectedTournee = Boolean(selectedItem)
  const isSuperAdmin = userRole === 'super_admin'
  const canAccess = useCallback(
    (page) => {
      if (page === SUPER_ADMIN_TAB) return isSuperAdmin || allowedPages.includes(page)
      return userRole === 'admin' || isSuperAdmin || allowedPages.includes(page)
    },
    [allowedPages, isSuperAdmin, userRole],
  )
  const hasTourneeAccess = canAccess('TOURNEES')
  /** Panneau liste TOURNÉES : uniquement sur les onglets tournée (AZIZA…), pas sur Dashboard, Paramétrage, etc. */
  const showTourneeSidebar = hasTourneeAccess && TOURNEE_TABS.includes(activeTab)

  const firstAllowedTab = useCallback(() => {
    if (canAccess(SUPER_ADMIN_TAB)) return SUPER_ADMIN_TAB
    if (hasTourneeAccess) return 'AZIZA'
    if (canAccess('DASHBOARD')) return 'DASHBOARD'
    if (canAccess('GPS')) return 'GPS'
    if (canAccess('CONFRONTATION')) return 'CONFRONTATION'
    if (canAccess('SIMULATEUR')) return 'SIMULATEUR'
    if (canAccess('PARAMETRAGE')) return 'PARAMETRAGE_AJOUTER_POIS'
    if (canAccess('OPTIMISATION')) return 'OPTIMISATION'
    if (canAccess('ADMIN')) return 'ADMIN'
    return 'DASHBOARD'
  }, [canAccess, hasTourneeAccess])
  // Load client labels once so tournée rows can display names instead of raw codes.
  useEffect(() => {
    let cancelled = false
    const normalizeCode = (v) => String(v ?? '').trim().toUpperCase()

    const loadClientLabels = async () => {
      try {
        const res = await fetch(apiUrl('/api/clients-poi/clients'))
        if (!res.ok) return
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : []
        const map = {}
        for (const it of items) {
          const code = normalizeCode(it?.code)
          const name = String(it?.nom ?? '').trim()
          if (!code || !name) continue
          map[code] = name
        }
        if (!cancelled) setClientNameByCode(map)
      } catch {
        if (!cancelled) setClientNameByCode({})
      }
    }

    loadClientLabels()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    if (TOURNEE_TABS.includes(activeTab) && hasTourneeAccess) return
    if (activeTab === 'DASHBOARD' && canAccess('DASHBOARD')) return
    if (activeTab === 'GPS' && canAccess('GPS')) return
    if (activeTab === 'ROUTE_OPT' && canAccess('TOURNEES')) return
    if (activeTab === 'CONFRONTATION' && canAccess('CONFRONTATION')) return
    if (activeTab === 'SIMULATEUR' && canAccess('SIMULATEUR')) return
    if (PARAMETRAGE_TABS.includes(activeTab) && canAccess('PARAMETRAGE')) return
    if (activeTab === 'OPTIMISATION' && canAccess('OPTIMISATION')) return
    if (activeTab === 'ADMIN' && canAccess('ADMIN')) return
    if (activeTab === SUPER_ADMIN_TAB && canAccess(SUPER_ADMIN_TAB)) return
    setActiveTab(firstAllowedTab())
  }, [isLoggedIn, activeTab, canAccess, hasTourneeAccess, firstAllowedTab])

  useEffect(() => {
    if (!isLoggedIn) return
    if (activeTab !== 'DASHBOARD') return
    if (activeFilterChips.length === 0) return
    clearFilters()
  }, [isLoggedIn, activeTab, activeFilterChips.length, clearFilters])

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowTourneeMenu(false)
      if (paramMenuRef.current && !paramMenuRef.current.contains(e.target)) setShowParametrageMenu(false)
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
  // OPTIMISTIC UI: show form instantly from list-item data, then enrich in background.
  const handleSelectItem = useCallback(async (item) => {
    if (!item) return

    // ── STEP 1: instant display — populate form from list item data right away ──
    setSelectedTmsId(item.id)
    setSelectedTmsItem(item)
    setLoadingDetail(false)           // never block the form render
    setDetailEnriching(true)          // show subtle progress banner instead

    // Switch to Tournée tab automatically
    if (!TOURNEE_TABS.includes(activeTab)) setActiveTab('AZIZA')

    // Show basic form data from the sidebar item IMMEDIATELY
    const instantForm = mergeLoadedFormWithItem(
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
        prestationId: '',
        siteId: item.site ?? '',
        autoFilledFromMobile: [],
      },
      item,
    )
    setFormData(instantForm)
    // Show a basic client row immediately so the table is populated
    setTableRows(appendClientRowIfNotDuplicate([EMPTY_ROW()], item))

    // ── STEP 2: PARALLEL background enrichment ──────────────────────────────────
    // Fire BOTH requests at the same time — no sequential waiting.
    try {
      const [formResult, detailResult] = await Promise.allSettled([
        fetch(apiUrl(`/api/tms/form-data/${encodeURIComponent(item.id)}`)).then(r => r.json()),
        fetch(apiUrl(`/api/tms/transport-data/by-tournee/${encodeURIComponent(item.id)}`)).then(r => r.ok ? r.json() : null),
      ])

      // ── Parse form-data response ──────────────────────────────────────────────
      // The API can return fields under 'formData', 'input_data', or flat at root.
      const data = formResult.status === 'fulfilled' ? formResult.value : null
      const fd   = data?.formData ?? data?.input_data ?? (
        data && typeof data === 'object' && !Array.isArray(data) ? data : null
      )
      const resolvedSite =
        fd?.siteId != null && String(fd.siteId).trim() !== ''
          ? String(fd.siteId).trim()
          : (item.site ?? '')

      // ── Update form fields — always call setFormData to apply enriched values ─
      // If fd is null (API had no data), re-merge with item so nothing is lost.
      const safefd = fd ?? {}
      setFormData(mergeLoadedFormWithItem({
        date:            safefd.date            ?? item.date        ?? '',
        wms:             safefd.wms             ?? item.wms         ?? '',
        prestation:      safefd.prestation      ?? item.prestation  ?? '',
        truck:           safefd.truck           ?? item.truck       ?? '',
        driver:          safefd.driver          ?? item.driver      ?? '',
        dep:             safefd.dep             ?? item.dep         ?? '',
        kmFacture:       safefd.kmFacture       ?? '',
        marchandise:     safefd.marchandise     ?? '',
        conformite:      safefd.conformite      ?? 'Conforme',
        observation:     safefd.observation     ?? '',
        hDepart:         safefd.hDepart         ?? '',
        kmDepart:        safefd.kmDepart        ?? '',
        hRetour:         safefd.hRetour         ?? '',
        kmRetour:        safefd.kmRetour        ?? '',
        kmDernierClient: safefd.kmDernierClient ?? '',
        kmMoy:           safefd.kmMoy           ?? '',
        totalPalettes:   safefd.totalPalettes   ?? '0',
        tourneeSec:      safefd.tourneeSec      ?? '0',
        apresMidi:       safefd.apresMidi       ?? false,
        interSite:       safefd.interSite       ?? false,
        gpsStartLat:     safefd.gpsStartLat     ?? '',
        gpsStartLng:     safefd.gpsStartLng     ?? '',
        gpsEndLat:       safefd.gpsEndLat       ?? '',
        gpsEndLng:       safefd.gpsEndLng       ?? '',
        gpsStartLabel:   safefd.gpsStartLabel   ?? '',
        gpsEndLabel:     safefd.gpsEndLabel     ?? '',
        prestationId:    safefd.prestationId    ?? '',
        siteId:          resolvedSite,
        autoFilledFromMobile: safefd.autoFilledFromMobile ?? [],
      }, item))

      // ── Pick table rows from whichever source has data ────────────────────────
      const rowsFromFormApi = data?.tableRows ?? data?.table_rows ?? []
      const rowsFromDetail  = detailResult.status === 'fulfilled'
        ? (detailResult.value?.tableRows ?? [])
        : []
      let baseRows = rowsFromFormApi.length > 0 ? rowsFromFormApi
        : rowsFromDetail.length > 0 ? rowsFromDetail
        : []

      // Show table rows right away (without KM enrichment)
      const baseRowsMerged = appendClientRowIfNotDuplicate(
        baseRows.length > 0 ? baseRows : [EMPTY_ROW()],
        item,
      )
      setTableRows(baseRowsMerged)

      // Dismiss the spinner NOW — KM enrichment runs as true fire-and-forget below
      setDetailEnriching(false)

      // ── KM enrichment: fire-and-forget, updates table when ready ─────────────
      if (resolvedSite) {
        fillMissingKmThRows(baseRowsMerged, resolvedSite)
          .then(enriched => setTableRows(enriched))
          .catch(() => { /* silent — base rows already shown */ })
      }

    } catch (e) {
      console.error('Erreur chargement tournée (background):', e)
      setDetailEnriching(false)
      // Keep the instant form already shown; silently try KM enrichment
      if (item.site) {
        fillMissingKmThRows(
          appendClientRowIfNotDuplicate([EMPTY_ROW()], item),
          item.site,
        ).then(merged => setTableRows(merged)).catch(() => {})
      }
    }
  }, [activeTab])

  // ── Table row helpers ─────────────────────────────────────────────────────────
  const updateClientRow = useCallback((index, field, value) => {
    if (field === 'client') {
      const origin = selectedItem?.site ? String(selectedItem.site).trim() : ''
      setTableRows((prev) => {
        const rows = [...prev]
        const cur = rows[index] ?? {}
        rows[index] = { ...cur, client: value, kmTh: !origin ? '' : cur.kmTh }
        if (origin) {
          const codes = rows.map((r) => String(r.client ?? '').trim())
          void fetchTheoreticalKmLegs(origin, codes).then((legKms) => {
            setTableRows((p) => applyLegKmsToRows(p, legKms))
          })
        }
        return rows
      })
      return
    }

    setTableRows((prev) => {
      const rows = [...prev]
      rows[index] = { ...rows[index], [field]: value }
      return rows
    })
  }, [selectedItem])

  // ── DELETE row ────────────────────────────────────────────────────────────────
  const deleteClientRow = useCallback((index) => {
    const origin = selectedItem?.site ? String(selectedItem.site).trim() : ''
    setTableRows((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (origin && next.some((r) => String(r.client ?? '').trim())) {
        const codes = next.map((r) => String(r.client ?? '').trim())
        void fetchTheoreticalKmLegs(origin, codes).then((legKms) => {
          setTableRows((p) => applyLegKmsToRows(p, legKms))
        })
      }
      return next
    })
  }, [selectedItem])

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
          {hasTourneeAccess && <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              className={'topnav-item' + (TOURNEE_TABS.includes(activeTab) ? ' topnav-item--active' : '')}
              onClick={() => {
                setShowTourneeMenu(!showTourneeMenu)
                setShowParametrageMenu(false)
              }}
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
          </div>}

          {canAccess('PARAMETRAGE') && (
            <div style={{ position: 'relative' }} ref={paramMenuRef}>
              <button
                className={'topnav-item' + (PARAMETRAGE_TABS.includes(activeTab) ? ' topnav-item--active' : '')}
                onClick={() => {
                  setShowParametrageMenu(!showParametrageMenu)
                  setShowTourneeMenu(false)
                }}
              >
                🎛️ PARAMÉTRAGE
              </button>
              {showParametrageMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    padding: '8px',
                    minWidth: '200px',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {PARAMETRAGE_MENU.map(({ tab, label }) => (
                    <button
                      key={tab}
                      type="button"
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        border: 'none',
                        background: activeTab === tab ? '#fff7ed' : 'transparent',
                        color: activeTab === tab ? '#f97316' : '#4b5563',
                        fontWeight: '700',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setActiveTab(tab)
                        setShowParametrageMenu(false)
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== tab) e.target.style.backgroundColor = '#f9fafb'
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== tab) e.target.style.backgroundColor = 'transparent'
                      }}
                    >
                      • {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {[
            { tab: 'DASHBOARD',     label: '📊 DASHBOARD' },
            { tab: 'CONFRONTATION', label: '⚖️ CONFRONTATION' },
            { tab: 'SIMULATEUR',    label: '💰 SIMULATEUR' },
            { tab: 'OPTIMISATION',  label: '📈 OPTIMISATION' },
          ]
            .filter(({ tab }) => (tab === 'ROUTE_OPT' ? canAccess('TOURNEES') : canAccess(tab)))
            .map(({ tab, label }) => (
            <button key={tab}
              className={'topnav-item' + (activeTab === tab ? ' topnav-item--active' : '')}
              onClick={() => setActiveTab(tab)}
            >{label}</button>
          ))}

          {canAccess('ADMIN') && (
            <button
              className={'topnav-item' + (activeTab === 'ADMIN' ? ' topnav-item--active' : '')}
              onClick={() => setActiveTab('ADMIN')}
            >⚙️ ADMIN</button>
          )}

          {canAccess(SUPER_ADMIN_TAB) && (
            <button
              className={'topnav-item' + (activeTab === SUPER_ADMIN_TAB ? ' topnav-item--active' : '')}
              onClick={() => setActiveTab(SUPER_ADMIN_TAB)}
            >👑 SUPER ADMIN</button>
          )}
        </nav>

        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{ background: theme === 'dark' ? '#2a2e35' : '#f1f5f9', border: `1px solid ${theme === 'dark' ? '#4b5563' : '#e2e8f0'}`, color: theme === 'dark' ? '#e2e8f0' : '#4b5563', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', marginRight: '12px' }}
          >
            {theme === 'dark' ? '🌤️ Clair' : '🌙 Sombre'}
          </button>
          <button className="btn-logout" onClick={() => { setIsLoggedIn(false); setAllowedPages(['TOURNEES', 'DASHBOARD']); setUserRole(null); setUserDisplayName('') }} style={{ marginLeft: '4px', backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fecaca', fontSize: '11px', padding: '6px 12px', cursor: 'pointer' }}>
            QUITTER
          </button>
        </div>
      </header>

      {/* ── Login overlay ─────────────────────────────────────────────────────── */}
      {!isLoggedIn && (
        <LoginScreen
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          onLogin={(user) => {
            const role = user?.role ?? 'user'
            const pages = Array.isArray(user?.allowedPages) && user.allowedPages.length
              ? user.allowedPages
              : ['TOURNEES', 'DASHBOARD', 'PARAMETRAGE', 'OPTIMISATION']
            setUserRole(role)
            setUserDisplayName(String(user?.name || user?.email || '').trim())
            setAllowedPages(pages)
            setIsLoggedIn(true)
            setActiveTab(
              pages.includes(SUPER_ADMIN_TAB)
                ? SUPER_ADMIN_TAB
                : pages.includes('TOURNEES')
                ? 'AZIZA'
                : pages.includes('DASHBOARD')
                  ? 'DASHBOARD'
                  : pages.includes('CONFRONTATION')
                      ? 'CONFRONTATION'
                      : pages.includes('SIMULATEUR')
                        ? 'SIMULATEUR'
                        : pages.includes('PARAMETRAGE')
                          ? 'PARAMETRAGE_AJOUTER_POIS'
                          : pages.includes('OPTIMISATION')
                            ? 'OPTIMISATION'
                            : role === 'admin' || pages.includes('ADMIN')
                              ? 'ADMIN'
                              : 'DASHBOARD',
            )
          }}
        />
      )}

      {/* ── Main layout ───────────────────────────────────────────────────────── */}
      {isLoggedIn && (
        <main className="layout" style={{ display: 'grid', gridTemplateColumns: showTourneeSidebar ? `${sidebarWidth}px minmax(0, 1fr)` : 'minmax(0, 1fr)' }}>
          {showTourneeSidebar && <Sidebar
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
          />}

          {/* Tournée page — always rendered when a tournée is selected; enrichment happens in background */}
          {TOURNEE_TABS.includes(activeTab) && hasTourneeAccess && (
            hasSelectedTournee ? (
              <TourneePage
                theme={theme}
                activeTab={activeTab}
                formData={formData}
                onFormChange={handleFormChange}
                tableRows={tableRows}
                clientNameByCode={clientNameByCode}
                onUpdateRow={updateClientRow}
                onDeleteRow={deleteClientRow}
                onSave={handleSaveForm}
                selectedTmsId={selectedTmsId}
                tourneeAlerts={forTournee(selectedTmsId)}
                detailEnriching={detailEnriching}
              />
            ) : (
              <section className="content" style={{ minHeight: 0 }}>
                <div className="card">
                  <div style={{ fontWeight: 800, color: '#7c2d12', marginBottom: '6px' }}>Sélection requise</div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>Sélectionnez une tournée dans la liste sur la gauche.</div>
                </div>
              </section>
            )
          )}

          {activeTab === 'DASHBOARD' && canAccess('DASHBOARD') && (
            <DashboardPage
              tms={tms}
              list={list}
              activeFilterChips={activeFilterChips}
              hasSelectedTournee={hasSelectedTournee}
              alerts={alerts}
              onSelectTournee={handleSelectItem}
            />
          )}

          {activeTab === 'CONFRONTATION' && canAccess('CONFRONTATION') && <ConfrontationPage alerts={alerts} refetchAlerts={refetchAlerts} />}
          {activeTab === 'SIMULATEUR' && canAccess('SIMULATEUR') && <SimulateurPage />}
          {PARAMETRAGE_TABS.includes(activeTab) && canAccess('PARAMETRAGE') && (
            <ParametragePage
              theme={theme}
              userDisplayName={userDisplayName}
              section={
                activeTab === 'PARAMETRAGE_CAMION'
                  ? 'camion'
                  : activeTab === 'PARAMETRAGE_DEPOTS'
                    ? 'depots'
                  : activeTab === 'PARAMETRAGE_TARIF'
                    ? 'tarif'
                    : 'ajouter_pois'
              }
            />
          )}
          {activeTab === 'OPTIMISATION' && canAccess('OPTIMISATION') && <OptimisationPage theme={theme} />}
          {activeTab === 'ADMIN' && canAccess('ADMIN') && <AdminPage />}
          {activeTab === SUPER_ADMIN_TAB && canAccess(SUPER_ADMIN_TAB) && (
            <SuperAdminTripsPage theme={theme} userDisplayName={userDisplayName} />
          )}
        </main>
      )}
    </div>
  )
}