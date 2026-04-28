const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in Backend_auth/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function run() {
  const client = await pool.connect();
  try {
    const dir = path.resolve(__dirname, '../database');
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No SQL files found in Backend_auth/database');
      return;
    }

    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      console.log(`Running ${file} ...`);
      await client.query(sql);
    }

    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
