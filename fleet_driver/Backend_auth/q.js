require('dotenv').config();
const { pool } = require('./src/db');
async function run() {
  try {
    const ch = await pool.query("SELECT id, nom, prenom, employee_id FROM chauffeurs WHERE employee_id='DRV-00001'");
    console.log(ch.rows);
    if(ch.rows.length>0) {
      const q = "SELECT count(*) FROM transport_data WHERE CAST(sal_id AS bigint) = " + ch.rows[0].id;
      const t = await pool.query(q);
      console.log('Trips count for DRV-00001:', t.rows[0].count);
    }
  } finally { pool.end(); }
}
run();
