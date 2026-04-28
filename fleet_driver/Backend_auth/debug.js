require('dotenv').config();
const { pool } = require('./src/db');
async function run() {
  const t = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'transport_data'");
  console.log('transport_data cols:', t.rows.map(r=>r.column_name).join(', '));
  const c = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'poi_clients'");
  console.log('poi_clients cols:', c.rows.map(r=>r.column_name).join(', '));
  const d = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'depots'");
  console.log('depots cols:', d.rows.map(r=>r.column_name).join(', '));
  await pool.end();
}
run();
