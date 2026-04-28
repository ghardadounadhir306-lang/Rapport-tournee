const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.+/g, '.');
}

function parseCsv(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows = [];
  const seen = new Set();

  for (const line of lines.slice(1)) {
    const raw = line.replace(/^"|"$/g, '');
    const match = raw.match(/^\('([^']*)', '([^']*)'\)$/);
    if (!match) continue;

    const fullName = match[1].trim().replace(/\s+/g, ' ');
    const tel = match[2].trim();
    if (!fullName) continue;

    const parts = fullName.split(' ').filter(Boolean);
    const prenom = parts.shift() || fullName;
    const nom = parts.length ? parts.join(' ') : prenom;
    const key = `${prenom} ${nom}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      prenom,
      nom,
      tel: tel === '0' ? null : tel,
    });
  }

  return rows;
}

async function main() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 5433),
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'postgres',
  });

  await client.connect();

  const schemaFile = path.join(__dirname, '..', 'sql', 'patches', '033_create_chauffeurs.sql');
  await client.query(fs.readFileSync(schemaFile, 'utf8'));

  const csvFile = path.join(__dirname, '..', '..', 'db-audit', 'csv', 'chauffeur.csv');
  const rows = parseCsv(csvFile);

  await client.query('TRUNCATE TABLE chauffeurs RESTART IDENTITY');

  const values = [];
  const params = [];
  let p = 1;
  rows.forEach((row, index) => {
    const cin = `CIN${String(index + 1).padStart(6, '0')}`;
    const email = `${slugify(row.prenom)}.${slugify(row.nom)}.${index + 1}@mock.local`;
    values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
    params.push(row.nom, row.prenom, cin, email, row.tel);
  });

  if (values.length) {
    await client.query(
      `INSERT INTO chauffeurs (nom, prenom, cin, email, tel) VALUES ${values.join(', ')}`,
      params,
    );
  }

  const count = await client.query('SELECT COUNT(*) AS total FROM chauffeurs');
  console.log(`Inserted ${count.rows[0].total} chauffeurs`);
  await client.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});