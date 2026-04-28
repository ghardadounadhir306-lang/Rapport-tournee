/* eslint-disable no-console */
const path = require('path');
const XLSX = require('xlsx');
const { Client } = require('pg');

const DEFAULT_CSV_PATH = path.resolve(__dirname, '../../docs/ExcelFile_2026-03-13T10_19_12.xlsx - Sheet1.csv');
const BATCH_SIZE = 500;

const SITE_MAPPINGS = [
  ['01', 'BAR'],
  ['05', 'TUN'],
  ['03', 'BKS'],
  ['02', 'SAL'],
  ['04', 'SFX'],
  ['06', 'GAB'],
  ['09', 'JER'],
  ['07', 'GAF'],
  ['08', 'BSL'],
  ['10', 'BIZ'],
  ['11', 'NAS'],
  ['13', 'MGH'],
];

const HEADER_TO_COLUMN = {
  AFFCODE: 'affcode',
  ARTCODE: 'artcode',
  CDATE: 'cdate',
  ENTNBPAL: 'entnbpal',
  OTDCODE: 'otdcode',
  OTSCONTAINER: 'otscontainer',
  OTSETAT: 'otsetat',
  OTSKM2: 'otskm2',
  OTSNUMBDX: 'otsnumbdx',
  OTTMT: 'ottmt',
  PLACHA1I: 'placha1i',
  PLAKM1: 'plakm1',
  PLAKM2: 'plakm2',
  PLALIB: 'plalib',
  PLAMOTI: 'plamoti',
  PLARGIARR: 'plargiarr',
  RGILIBL: 'rgilibl',
  SALNOM: 'salnom',
  SALTEL: 'saltel',
  SITCODE: 'sitcode',
  SITSIRETEDI: 'sitsiretedi',
  TIECODE: 'tiecode',
  TOUCODE: 'toucode',
  VOYCLE: 'voycle',
  VOYDTD: 'voydtd',
  VOYHRD: 'voyhrd',
  VOYHRF: 'voyhrf',
  VOYPAL: 'voypal',
  performance_camion: 'performance_camion',
  performance_chauffeur: 'performance_chauffeur',
  taux_remplissage_pal: 'taux_remplissage_pal',
  taux_remplissage_ton: 'taux_remplissage_ton',
  MDATE: 'mdate',
  SITECHAUFF: 'sitechauff',
  SITECAMION: 'sitecamion',
  SALMEMOE: 'salmemoe',
  OTSNUM: 'otsnum',
  PLATOUORDRE: 'platouordre',
  SALMOBILITE: 'salmobilite',
  KM_TSP: 'km_tsp',
  TOUTRAFCODE: 'toutrafcode',
  CHARGEMENT: 'chargement',
  VOYDTF: 'voydtf',
  OTDHD: 'otdhd',
  VOYMEMO: 'voymemo',
};

const COLUMN_ORDER = [
  'affcode', 'artcode', 'cdate', 'entnbpal', 'otdcode', 'otscontainer', 'otsetat', 'otskm2', 'otsnumbdx',
  'ottmt', 'placha1i', 'plakm1', 'plakm2', 'plalib', 'plamoti', 'plargiarr', 'rgilibl', 'salnom', 'saltel',
  'sitcode', 'sitsiretedi', 'tiecode', 'toucode', 'voycle', 'voydtd', 'voyhrd', 'voyhrf', 'voypal',
  'performance_camion', 'performance_chauffeur', 'taux_remplissage_pal', 'taux_remplissage_ton', 'mdate',
  'sitechauff', 'sitecamion', 'salmemoe', 'otsnum', 'platouordre', 'salmobilite', 'km_tsp', 'toutrafcode',
  'chargement', 'voydtf', 'otdhd', 'voymemo',
];

const NORMALIZED_HEADER_TO_COLUMN = Object.entries(HEADER_TO_COLUMN).reduce((acc, [header, column]) => {
  acc[normalizeHeader(header)] = column;
  return acc;
}, {});

const KEY_QUALITY_COLUMNS = ['otdcode', 'sitcode', 'toucode', 'voycle', 'salnom'];

function normalizeHeader(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function cleanRaw(value) {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  if (!v) return null;
  const lowered = v.toLowerCase();
  if (lowered === 'none' || lowered === 'undefined' || lowered === 'null') return null;
  return v;
}

function parseDateTime(value) {
  const v = cleanRaw(value);
  if (!v) return null;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min, ss] = m;
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function parseDate(value) {
  const v = cleanRaw(value);
  if (!v) return null;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s\d{2}:\d{2}:\d{2})?$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function parseTime(value) {
  const v = cleanRaw(value);
  if (!v) return null;
  if (/^\d{4}$/.test(v)) return `${v.slice(0, 2)}:${v.slice(2, 4)}:00`;
  if (/^\d{1,2}:\d{2}$/.test(v)) {
    const [h, m] = v.split(':');
    return `${h.padStart(2, '0')}:${m}:00`;
  }
  return null;
}

function parseInteger(value) {
  const v = cleanRaw(value);
  if (!v) return null;
  if (!/^-?\d+$/.test(v)) return null;
  const parsed = Number.parseInt(v, 10);
  if (!Number.isSafeInteger(parsed)) return null;
  if (parsed < -2147483648 || parsed > 2147483647) return null;
  return parsed;
}

function parseNumeric(value) {
  const v = cleanRaw(value);
  if (!v) return null;
  if (!/^-?\d+(\.\d+)?$/.test(v)) return null;
  return Number(v);
}

function normalizeRow(row) {
  return {
    affcode: cleanRaw(row.affcode),
    artcode: cleanRaw(row.artcode),
    cdate: parseDateTime(row.cdate),
    entnbpal: parseInteger(row.entnbpal),
    otdcode: cleanRaw(row.otdcode),
    otscontainer: cleanRaw(row.otscontainer),
    otsetat: cleanRaw(row.otsetat),
    otskm2: parseNumeric(row.otskm2),
    otsnumbdx: parseInteger(row.otsnumbdx),
    ottmt: cleanRaw(row.ottmt),
    placha1i: cleanRaw(row.placha1i),
    plakm1: parseNumeric(row.plakm1),
    plakm2: parseNumeric(row.plakm2),
    plalib: cleanRaw(row.plalib),
    plamoti: cleanRaw(row.plamoti),
    plargiarr: cleanRaw(row.plargiarr),
    rgilibl: cleanRaw(row.rgilibl),
    salnom: cleanRaw(row.salnom),
    saltel: cleanRaw(row.saltel),
    sitcode: cleanRaw(row.sitcode),
    sitsiretedi: cleanRaw(row.sitsiretedi),
    tiecode: cleanRaw(row.tiecode),
    toucode: cleanRaw(row.toucode),
    voycle: cleanRaw(row.voycle),
    voydtd: parseDate(row.voydtd),
    voyhrd: parseTime(row.voyhrd),
    voyhrf: parseTime(row.voyhrf),
    voypal: parseInteger(row.voypal),
    performance_camion: parseNumeric(row.performance_camion),
    performance_chauffeur: parseNumeric(row.performance_chauffeur),
    taux_remplissage_pal: parseNumeric(row.taux_remplissage_pal),
    taux_remplissage_ton: parseNumeric(row.taux_remplissage_ton),
    mdate: parseDateTime(row.mdate),
    sitechauff: cleanRaw(row.sitechauff),
    sitecamion: cleanRaw(row.sitecamion),
    salmemoe: cleanRaw(row.salmemoe),
    otsnum: cleanRaw(row.otsnum),
    platouordre: cleanRaw(row.platouordre),
    salmobilite: cleanRaw(row.salmobilite),
    km_tsp: parseNumeric(row.km_tsp),
    toutrafcode: cleanRaw(row.toutrafcode),
    chargement: cleanRaw(row.chargement),
    voydtf: parseDate(row.voydtf),
    otdhd: cleanRaw(row.otdhd),
    voymemo: cleanRaw(row.voymemo),
  };
}

function buildInsert(rows) {
  const values = [];
  const placeholders = [];
  let p = 1;

  for (const row of rows) {
    const norm = normalizeRow(row);
    const rowPlaceholders = [];
    for (const col of COLUMN_ORDER) {
      values.push(norm[col]);
      rowPlaceholders.push(`$${p++}`);
    }
    placeholders.push(`(${rowPlaceholders.join(', ')})`);
  }

  const sql = `
    INSERT INTO transport_data (
      "affcode", "artcode", "cdate", "entnbpal", "otdcode", "otscontainer", "otsetat", "otskm2", "otsnumbdx",
      "ottmt", "placha1i", "plakm1", "plakm2", "plalib", "plamoti", "plargiarr", "rgilibl", "salnom", "saltel",
      "sitcode", "sitsiretedi", "tiecode", "toucode", "voycle", "voydtd", "voyhrd", "voyhrf", "voypal",
      "performance_camion", "performance_chauffeur", "taux_remplissage_pal", "taux_remplissage_ton", "mdate",
      "sitechauff", "sitecamion", "salmemoe", "otsnum", "platouordre", "salmobilite", "km_tsp", "toutrafcode",
      "chargement", "voydtf", "otdhd", "voymemo"
    )
    VALUES ${placeholders.join(', ')}
  `;

  return { sql, values };
}

function parseCsv(csvPath) {
  const workbook = XLSX.readFile(csvPath, { raw: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: false,
    blankrows: false,
  });

  return rows.map((sourceRow) => {
    const normalizedSource = {};
    for (const [key, value] of Object.entries(sourceRow)) {
      normalizedSource[normalizeHeader(key)] = value;
    }

    const mapped = {};
    for (const [normalizedHeader, column] of Object.entries(NORMALIZED_HEADER_TO_COLUMN)) {
      mapped[column] = normalizedSource[normalizedHeader] ?? null;
    }
    return mapped;
  });
}

function assertImportQuality(rows) {
  if (!rows.length) {
    throw new Error('CSV has no data rows to import.');
  }

  const quality = {};
  for (const key of KEY_QUALITY_COLUMNS) {
    quality[key] = rows.reduce((acc, row) => {
      const v = cleanRaw(row[key]);
      return acc + (v ? 1 : 0);
    }, 0);
  }

  const hasAnySignal = KEY_QUALITY_COLUMNS.some((key) => quality[key] > 0);
  if (!hasAnySignal) {
    throw new Error(
      `Import aborted: key columns are empty after header mapping (${KEY_QUALITY_COLUMNS.join(', ')}). Check CSV headers.`,
    );
  }

  if (rows.length >= 100 && quality.otdcode === 0) {
    throw new Error('Import aborted: OTDCODE coverage is zero; source/header mapping is invalid for business data.');
  }

  console.log('Import quality snapshot:', quality);
}

async function postImportMaintenance(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS transport_sites (
      num_site VARCHAR(2) PRIMARY KEY,
      code_site VARCHAR(16) NOT NULL UNIQUE
    )
  `);

  for (const [numSite, codeSite] of SITE_MAPPINGS) {
    await client.query(
      `
        INSERT INTO transport_sites (num_site, code_site)
        VALUES ($1, $2)
        ON CONFLICT (num_site) DO UPDATE SET code_site = EXCLUDED.code_site
      `,
      [numSite, codeSite],
    );
  }

  await client.query(`
    UPDATE transport_data td
    SET sitcode = ts.code_site
    FROM transport_sites ts
    WHERE td.sitcode IS NOT NULL
      AND regexp_replace(trim(td.sitcode), '^0+', '') = regexp_replace(ts.num_site, '^0+', '')
      AND trim(td.sitcode) <> ts.code_site
  `);

  await client.query(`
    UPDATE transport_data td
    SET sitechauff = ts.code_site
    FROM transport_sites ts
    WHERE td.sitechauff IS NOT NULL
      AND regexp_replace(trim(td.sitechauff), '^0+', '') = regexp_replace(ts.num_site, '^0+', '')
      AND trim(td.sitechauff) <> ts.code_site
  `);

  await client.query(`
    UPDATE transport_data td
    SET sitecamion = ts.code_site
    FROM transport_sites ts
    WHERE td.sitecamion IS NOT NULL
      AND regexp_replace(trim(td.sitecamion), '^0+', '') = regexp_replace(ts.num_site, '^0+', '')
      AND trim(td.sitecamion) <> ts.code_site
  `);

  await client.query('TRUNCATE TABLE transport_poi_clients, transport_depots');

  await client.query(`
    INSERT INTO transport_depots (transport_id, depot_id)
    SELECT t.id, d.id
    FROM transport_data t
    JOIN depots d ON t.sitcode = d.code
    ON CONFLICT (transport_id, depot_id) DO NOTHING
  `);

  await client.query(`
    INSERT INTO transport_depots (transport_id, depot_id)
    SELECT t.id, d.id
    FROM transport_data t
    JOIN depots d ON t.otdcode = d.code
    ON CONFLICT (transport_id, depot_id) DO NOTHING
  `);

  await client.query(`
    INSERT INTO transport_poi_clients (transport_id, poi_client_id)
    SELECT t.id, p.id
    FROM transport_data t
    JOIN poi_clients p ON t.otdcode = p.code
    ON CONFLICT (transport_id, poi_client_id) DO NOTHING
  `);

  await client.query(`
    INSERT INTO transport_poi_clients (transport_id, poi_client_id)
    SELECT t.id, p.id
    FROM transport_data t
    JOIN poi_clients p ON t.tiecode = p.code
    ON CONFLICT (transport_id, poi_client_id) DO NOTHING
  `);
}

async function main() {
  const csvPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_CSV_PATH;
  const rows = parseCsv(csvPath);
  assertImportQuality(rows);

  const client = new Client({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5433),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
  });

  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE transport_poi_clients, transport_depots, transport_data RESTART IDENTITY');

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      const { sql, values } = buildInsert(chunk);
      await client.query(sql, values);
    }

    await postImportMaintenance(client);

    await client.query('COMMIT');

    const result = await client.query('SELECT COUNT(*)::INT AS count FROM transport_data');
    console.log(`Imported rows: ${result.rows[0].count}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
