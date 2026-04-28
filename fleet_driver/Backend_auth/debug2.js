require('dotenv').config();
const { pool } = require('./src/db');
async function run() {
  try {
    const chauff = await pool.query('SELECT id, employee_id FROM chauffeurs LIMIT 3');
    console.log('chauffeurs:', chauff.rows);
    const trans = await pool.query('SELECT tt.id, tt.sal_id, tt.sitcode, tt.otdcode, d.name AS depot, p.name as poi FROM transport_data tt LEFT JOIN depots d ON d.code = tt.sitcode LEFT JOIN poi_clients p ON p.code = tt.otdcode LIMIT 3');
    console.log('sample transport_data associated:', trans.rows);
  } catch(e) { console.error(e); } finally { await pool.end(); }
}
run();
