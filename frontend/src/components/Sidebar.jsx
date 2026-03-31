import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'

// ─── Column definitions ──────────────────────────────────────────────────────
// gridCol: valid CSS grid track value
const COLUMNS = [
  { label: 'N° WMS',      sub: 'OTSNUMBDX',     gridCol: '100px', key: 'wms'       },
  { label: 'N° TMS',      sub: 'OTDCODE',        gridCol: '115px', key: 'tms'       },
  { label: 'DATE',        sub: 'CDATE',          gridCol: '82px',  key: 'date'      },
  { label: 'SITE',        sub: 'SITCODE',        gridCol: '52px',  key: 'site'      },
  { label: 'CAMION',      sub: 'VOYCLE',         gridCol: '80px',  key: 'truck'     },
  { label: 'CHAUFFEUR',   sub: 'SALNOM',         gridCol: '95px',  key: 'driver'    },
  { label: 'DEP',         sub: 'TOUTRAFCODE',    gridCol: '50px',  key: 'dep'       },
  { label: 'PRESTATION',  sub: 'PLALIB/ARTCODE', gridCol: '1fr',   key: 'prestation'},
]

const GRID_TEMPLATE = COLUMNS.map((c) => c.gridCol).join(' ')
const ROW_H = 32
const MIN_SIDEBAR_W = 680

// ─── Single virtual row ───────────────────────────────────────────────────────
const VRow = React.memo(function VRow({ index, style, data }) {
  const { filteredList, selectedTmsId, onSelectItem } = data
  const item   = filteredList[index]
  const active = item.id === selectedTmsId
  const even   = index % 2 === 0

  const cells = [
    item.wms,
    item.tms || String(item.id ?? '').replace(/^(tms-|td-)/, ''),
    item.date ? String(item.date).slice(0, 10) : null,
    item.site,
    item.truck,
    item.driver ? String(item.driver).split(' ')[0] : null,
    item.dep,
    item.prestation,
  ]

  return (
    <div
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: GRID_TEMPLATE,
        alignItems: 'stretch',
        cursor: 'pointer',
        backgroundColor: active ? '#fed7aa' : even ? '#ffffff' : '#fafafa',
        borderLeft: active ? '3px solid #f97316' : '3px solid transparent',
        borderBottom: '1px solid #e9ecef',
        fontWeight: active ? 700 : 400,
        boxSizing: 'border-box',
        transition: 'background-color 0.1s',
      }}
      onClick={() => onSelectItem(item)}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#fff7ed' }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = active ? '#fed7aa' : even ? '#ffffff' : '#fafafa' }}
    >
      {cells.map((val, ci) => (
        <div
          key={ci}
          style={{
            padding: '0 6px',
            fontSize: '11px',
            color: ci === 1 ? '#c2410c' : '#374151',
            fontWeight: ci === 1 ? 700 : 'inherit',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            borderRight: ci < COLUMNS.length - 1 ? '1px solid #e9ecef' : 'none',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}
          title={val || ''}
        >
          {val || <span style={{ color: '#cbd5e1' }}>—</span>}
        </div>
      ))}
    </div>
  )
})

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar({
  sidebarWidth,
  onResizeStart,
  tmsFilters,
  setTmsFilters,
  filteredList,
  list,
  activeFilterChips,
  clearFilters,
  selectedTmsId,
  onSelectItem,
}) {
  const listRef      = useRef(null)
  const containerRef = useRef(null)
  const [listSize, setListSize] = useState({ height: 400, width: 800 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { height, width } = entries[0].contentRect
      if (height > 0 && width > 0) setListSize({ height, width })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const itemData = React.useMemo(
    () => ({ filteredList, selectedTmsId, onSelectItem }),
    [filteredList, selectedTmsId, onSelectItem],
  )

  const onFilterChange = useCallback((key, value) => {
    setTmsFilters((prev) => ({ ...prev, [key]: value }))
    listRef.current?.scrollTo(0)
  }, [setTmsFilters])

  return (
    <aside
      className="sidebar"
      style={{
        width: `${sidebarWidth}px`,
        minWidth: `${Math.max(sidebarWidth, 320)}px`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        background: '#fff',
        borderRight: '2px solid #e2e8f0',
        boxSizing: 'border-box',
      }}
    >
      {/* Resize handle */}
      <div className="sidebar-resizer" onMouseDown={onResizeStart} />

      {/* ── Top header ─────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: 'linear-gradient(135deg, #1e2126 0%, #2a2e35 100%)',
        padding: '10px 14px 8px',
        minWidth: `${MIN_SIDEBAR_W}px`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '18px', background: '#f97316', borderRadius: '2px' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Tournées Disponibles
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>affiché</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#f97316', background: 'rgba(249,115,22,0.15)', padding: '2px 10px', borderRadius: '999px', border: '1px solid rgba(249,115,22,0.3)' }}>
              {filteredList.length.toLocaleString()}
            </span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>/</span>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{list.length.toLocaleString()}</span>
          </div>
        </div>

        {/* Filter grid — 4 per row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '6px' }}>
          {COLUMNS.map(({ key, label }) => (
            <input
              key={key}
              type="text"
              placeholder={label}
              value={tmsFilters[key] ?? ''}
              onChange={(e) => onFilterChange(key, e.target.value)}
              style={{
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '4px',
                border: tmsFilters[key] ? '1px solid #f97316' : '1px solid #363b45',
                background: tmsFilters[key] ? '#fff7ed' : '#1a1d21',
                color: tmsFilters[key] ? '#7c2d12' : '#94a3b8',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#f97316'; e.target.style.boxShadow = '0 0 0 2px rgba(249,115,22,0.2)' }}
              onBlur={(e)  => { e.target.style.borderColor = tmsFilters[key] ? '#f97316' : '#363b45'; e.target.style.boxShadow = 'none' }}
            />
          ))}
        </div>

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {activeFilterChips.map((chip) => (
              <span
                key={`${chip.label}-${chip.value}`}
                style={{ fontSize: '10px', padding: '1px 7px', background: 'rgba(249,115,22,0.15)', color: '#fb923c', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '999px', fontWeight: 700 }}
              >
                {chip.label}: {chip.value}
              </span>
            ))}
            <button
              onClick={() => { clearFilters(); listRef.current?.scrollTo(0) }}
              style={{ fontSize: '10px', padding: '1px 8px', border: '1px solid #363b45', background: 'transparent', borderRadius: '4px', cursor: 'pointer', color: '#ef4444', fontWeight: 700 }}
            >
              ✕ Effacer
            </button>
          </div>
        )}
      </div>

      {/* ── Column header ──────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        display: 'grid',
        gridTemplateColumns: GRID_TEMPLATE,
        background: '#c5b099',
        borderBottom: '2px solid #a89070',
        minWidth: `${MIN_SIDEBAR_W}px`,
      }}>
        {COLUMNS.map((col, i) => (
          <div
            key={col.key}
            style={{
              padding: '6px 6px 5px',
              borderRight: i < COLUMNS.length - 1 ? '1px solid rgba(0,0,0,0.12)' : 'none',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {col.label}
            </div>
            <div style={{ fontSize: '9px', color: '#78716c', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {col.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Virtual list ───────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: `${MIN_SIDEBAR_W}px`,
          background: '#fff',
          overflowX: 'hidden',
          overflowY: 'hidden',
        }}
      >
        {filteredList.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '8px',
            color: '#94a3b8',
          }}>
            <div style={{ fontSize: '28px' }}>🔍</div>
            <div style={{ fontSize: '13px', fontStyle: 'italic' }}>Aucune tournée trouvée</div>
          </div>
        ) : (
          <FixedSizeList
            ref={listRef}
            height={listSize.height}
            width={listSize.width}
            itemCount={filteredList.length}
            itemSize={ROW_H}
            itemData={itemData}
            overscanCount={20}
          >
            {VRow}
          </FixedSizeList>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '4px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minWidth: `${MIN_SIDEBAR_W}px`,
      }}>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
          {filteredList.length < list.length
            ? `${filteredList.length.toLocaleString()} résultat(s) filtré(s)`
            : `${list.length.toLocaleString()} tournée(s) au total`}
        </span>
        {selectedTmsId && (
          <span style={{ fontSize: '10px', color: '#f97316', fontWeight: 700 }}>
            ● sélectionné
          </span>
        )}
      </div>
    </aside>
  )
}
