import * as XLSX from 'xlsx'
import { WAREHOUSE_CODES } from './constants'

function norm(s) {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function findColumnKey(row, candidates) {
  const keys = Object.keys(row)
  for (const c of candidates) {
    const nc = norm(c)
    const hit = keys.find((k) => norm(k) === nc)
    if (hit) return hit
  }
  for (const c of candidates) {
    const nc = norm(c)
    const hit = keys.find((k) => norm(k).includes(nc) || nc.includes(norm(k)))
    if (hit) return hit
  }
  return null
}

function toNum(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const s = String(v).trim().replace(',', '.')
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : null
}

export function parseClientsPoiWorkbook(wb) {
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return []
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null })
  const out = []

  for (const raw of rows) {
    const kCode = findColumnKey(raw, ['Code Client', 'code client', 'Code', 'code'])
    const kNom = findColumnKey(raw, ['Nom Client', 'nom client', 'Nom', 'nom'])
    const kLat = findColumnKey(raw, ['Latitude', 'latitude', 'Lat', 'lat'])
    const kLng = findColumnKey(raw, ['Longitude', 'longitude', 'Lng', 'lon', 'Long'])

    if (!kCode || !kLat || !kLng) continue

    const code = String(raw[kCode] ?? '').trim()
    const nom = kNom ? String(raw[kNom] ?? '').trim() : ''
    const lat = toNum(raw[kLat])
    const lng = toNum(raw[kLng])
    if (!code || lat === null || lng === null) continue

    out.push({ code, nom, lat, lng })
  }

  return out
}

export function splitDepotsAndClients(rows) {
  const depots = []
  const clients = []
  for (const r of rows) {
    const c = r.code.trim().toUpperCase()
    const isDepot = r.isDepot === true || WAREHOUSE_CODES.has(c)
    if (isDepot) depots.push({ ...r, code: c, isDepot: true })
    else clients.push({ ...r, code: c })
  }
  return { depots, clients }
}

export function exportTableToXlsx(rows) {
  const ws = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      '#': r.ordre,
      Code: r.code,
      'Nom Client': r.nom,
      'Étape (km)': r.etape,
      'Cumulé (km)': r.cumul,
    })),
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Tournée')
  XLSX.writeFile(wb, `tournee_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
