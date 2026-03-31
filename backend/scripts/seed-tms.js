/**
 * Seed tms_import_rows from TMS export CSV (SheetJS + mysql2).
 * Usage: from backend/: node scripts/seed-tms.js
 * Env: TMS_SEED_CSV=path\to\file.csv (optional)
 */

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

const BATCH = 500;

const COLS = [
  'affcode',
  'artcode',
  'cdate',
  'entnbpal',
  'otdcode',
  'otscontainer',
  'otsetat',
  'otskm2',
  'otsnumbdx',
  'ottmt',
  'placha1i',
  'plakm1',
  'plakm2',
  'plalib',
  'plamoti',
  'plargiarr',
  'rgilibl',
  'salnom',
  'saltel',
  'sitcode',
  'sitsiretedi',
  'tiecode',
  'toucode',
  'voycle',
  'voydtd',
  'voyhrd',
  'voyhrf',
  'voypal',
  'performance_camion',
  'performance_chauffeur',
  'taux_remplissage_pal',
  'taux_remplissage_ton',
  'mdate',
  'sitechauff',
  'sitecamion',
  'salmemoe',
  'otsnum',
  'platouordre',
  'salmobilite',
  'km_tsp',
  'toutrafcode',
  'chargement',
  'voydtf',
  'otdhd',
  'voymemo',
];

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return {};
  const text = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

function pick(row, ...names) {
  for (const n of names) {
    if (Object.prototype.hasOwnProperty.call(row, n) && row[n] !== undefined && row[n] !== '') {
      return row[n];
    }
    const up = n.toUpperCase();
    for (const k of Object.keys(row)) {
      if (k.toUpperCase() === up) return row[k];
    }
  }
  return undefined;
}

/** @returns {Date|null} */
function parseDateTime(val) {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return null;
    if (val.getFullYear() === 1899 && val.getMonth() === 11 && val.getDate() === 31) return null;
    return val;
  }
  const s = String(val).trim();
  if (!s || s === 'undefined' || s.toLowerCase() === 'none') return null;
  if (s.startsWith('31/12/1899')) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?/);
  if (!m) return null;
  const d = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const y = parseInt(m[3], 10);
  if (m[4] !== undefined) {
    return new Date(y, mo, d, parseInt(m[4], 10), parseInt(m[5], 10), parseInt(m[6], 10));
  }
  return new Date(y, mo, d);
}

function formatDateOnly(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTimeMs(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}.${ms}`;
}

function toStr(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && !Number.isNaN(val)) return String(val);
  const s = String(val).trim();
  if (!s || s === 'undefined' || s.toLowerCase() === 'none') return null;
  return s;
}

function parseDecimal(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const s = String(val).trim();
  if (!s || s === 'undefined' || s.toLowerCase() === 'none') return null;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseKmTsp(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (!s || s === 'undefined' || s.toLowerCase() === 'none') return null;
  if (s === '00') return 0;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function parseIntSafe(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number' && Number.isFinite(val)) return Math.trunc(val);
  const s = String(val).trim();
  if (!s || s === 'undefined') return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function mapRow(row) {
  const cdt = parseDateTime(pick(row, 'CDATE', 'cdate'));
  const voydtd = parseDateTime(pick(row, 'VOYDTD', 'voydtd'));
  const mdate = parseDateTime(pick(row, 'MDATE', 'mdate'));
  const voydtf = parseDateTime(pick(row, 'VOYDTF', 'voydtf'));
  const otdhd = parseDateTime(pick(row, 'OTDHD', 'otdhd'));

  const toutrafcode = toStr(pick(row, 'TOUTRAFCODE', 'toutrafcode'));
  const voymemoVal = pick(row, 'VOYMEMO', 'voymemo');
  let voymemo = toStr(voymemoVal);
  if (voymemoVal !== undefined && voymemoVal !== null && String(voymemoVal).trim() === 'undefined') {
    voymemo = null;
  }

  return [
    toStr(pick(row, 'AFFCODE', 'affcode')),
    toStr(pick(row, 'ARTCODE', 'artcode')),
    formatDateOnly(cdt),
    parseIntSafe(pick(row, 'ENTNBPAL', 'entnbpal')),
    toStr(pick(row, 'OTDCODE', 'otdcode')),
    toStr(pick(row, 'OTSCONTAINER', 'otscontainer')),
    toStr(pick(row, 'OTSETAT', 'otsetat')),
    parseDecimal(pick(row, 'OTSKM2', 'otskm2')),
    toStr(pick(row, 'OTSNUMBDX', 'otsnumbdx')),
    toStr(pick(row, 'OTTMT', 'ottmt')),
    toStr(pick(row, 'PLACHA1I', 'placha1i')),
    parseDecimal(pick(row, 'PLAKM1', 'plakm1')),
    parseDecimal(pick(row, 'PLAKM2', 'plakm2')),
    toStr(pick(row, 'PLALIB', 'plalib')),
    toStr(pick(row, 'PLAMOTI', 'plamoti')),
    toStr(pick(row, 'PLARGIARR', 'plargiarr')),
    toStr(pick(row, 'RGILIBL', 'rgilibl')),
    toStr(pick(row, 'SALNOM', 'salnom')),
    toStr(pick(row, 'SALTEL', 'saltel')),
    toStr(pick(row, 'SITCODE', 'sitcode')),
    toStr(pick(row, 'SITSIRETEDI', 'sitsiretedi')),
    toStr(pick(row, 'TIECODE', 'tiecode')),
    toStr(pick(row, 'TOUCODE', 'toucode')),
    toStr(pick(row, 'VOYCLE', 'voycle')),
    formatDateTimeMs(voydtd),
    toStr(pick(row, 'VOYHRD', 'voyhrd')),
    toStr(pick(row, 'VOYHRF', 'voyhrf')),
    parseIntSafe(pick(row, 'VOYPAL', 'voypal')),
    parseDecimal(pick(row, 'performance_camion', 'PERFORMANCE_CAMION')),
    parseDecimal(pick(row, 'performance_chauffeur', 'PERFORMANCE_CHAUFFEUR')),
    parseDecimal(pick(row, 'taux_remplissage_pal', 'TAUX_REMPLISSAGE_PAL')),
    parseDecimal(pick(row, 'taux_remplissage_ton', 'TAUX_REMPLISSAGE_TON')),
    formatDateTimeMs(mdate),
    toStr(pick(row, 'SITECHAUFF', 'sitechauff')),
    toStr(pick(row, 'SITECAMION', 'sitecamion')),
    toStr(pick(row, 'SALMEMOE', 'salmemoe')),
    toStr(pick(row, 'OTSNUM', 'otsnum')),
    parseIntSafe(pick(row, 'PLATOUORDRE', 'platouordre')),
    toStr(pick(row, 'SALMOBILITE', 'salmobilite')),
    parseKmTsp(pick(row, 'KM_TSP', 'km_tsp')),
    toutrafcode,
    toStr(pick(row, 'CHARGEMENT', 'chargement')),
    formatDateTimeMs(voydtf),
    formatDateTimeMs(otdhd),
    voymemo,
  ];
}

async function ensureImportSchema(conn) {
  const [rOtt] = await conn.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tms_import_rows'
       AND COLUMN_NAME = 'ottmt' AND DATA_TYPE = 'varchar' AND CHARACTER_MAXIMUM_LENGTH >= 64`,
  );
  if (!rOtt[0].c) {
    await conn.query('ALTER TABLE tms_import_rows MODIFY COLUMN ottmt VARCHAR(64) NULL');
    console.log('Schema: ottmt column set to VARCHAR(64).');
  }
  const [rVoy] = await conn.query(
    `SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tms_import_rows' AND COLUMN_NAME = 'voyhrf'`,
  );
  if (!rVoy[0].c) {
    await conn.query('ALTER TABLE tms_import_rows ADD COLUMN voyhrf VARCHAR(32) NULL AFTER voyhrd');
    console.log('Schema: voyhrf column added.');
  }
}

async function main() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = loadEnv(envPath);

  const defaultCsv = path.join(
    process.env.USERPROFILE || process.env.HOME || '',
    'Downloads',
    'Copie de ExcelFile_2026-03-13T10_19_12.xlsx - Sheet1.csv',
  );
  const csvPath = process.env.TMS_SEED_CSV || defaultCsv;

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    console.error('Set TMS_SEED_CSV to the full path of your Sheet1.csv');
    process.exit(1);
  }

  console.log(`Reading: ${csvPath}`);

  const workbook = XLSX.readFile(csvPath, { raw: false, cellDates: true, FS: ',' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
  console.log(`Parsed ${rows.length} data rows`);

  const pool = mysql.createPool({
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD === undefined ? '' : env.DB_PASSWORD,
    database: env.DB_NAME || 'r_tournee',
    waitForConnections: true,
    connectionLimit: 4,
    dateStrings: false,
  });

  const rowPh = `(${COLS.map(() => '?').join(', ')})`;

  await pool.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');

  let inserted = 0;
  const conn = await pool.getConnection();
  try {
    await ensureImportSchema(conn);
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DELETE FROM tms_import_rows');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const valueRows = chunk.map((r) => mapRow(r));
      const sql = `INSERT INTO tms_import_rows (${COLS.join(', ')}) VALUES ${chunk.map(() => rowPh).join(', ')}`;
      const flat = valueRows.flat();
      await conn.query(sql, flat);
      inserted += chunk.length;
      if (inserted % 2000 === 0 || inserted === rows.length) {
        console.log(`Inserted ${inserted} / ${rows.length}`);
      }
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
    await pool.end();
  }

  console.log(`Done. Total rows inserted: ${inserted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
