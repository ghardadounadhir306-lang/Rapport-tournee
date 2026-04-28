const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL in Backend_auth/.env');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
