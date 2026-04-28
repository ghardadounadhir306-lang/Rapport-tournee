require('dotenv').config();
const { pool } = require('./src/db');
async function run() {
  try {
    const q = "SELECT sal_id, count(*) FROM transport_data GROUP BY sal_id HAVING count(*) > 0 ORDER BY count(*) DESC LIMIT 10";
    const t = await pool.query(q);
    console.log('Top drivers by trips:', t.rows.map(r => r.sal_id + ':' + r.count).join(', '));
  } finally { pool.end(); }
}
run();
