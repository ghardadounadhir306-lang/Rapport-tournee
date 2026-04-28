require('dotenv').config();
const { pool } = require('./src/db');
async function run() {
  try {
    const match1 = await pool.query("SELECT c.id as c_id, c.employee_id, t.sal_id FROM transport_data t JOIN chauffeurs c ON c.id = t.sal_id LIMIT 2");
    console.log('Match by c.id:', match1.rows);
  } catch(e) { console.error(e); }
  try {
    const match2 = await pool.query("SELECT c.id, c.employee_id, t.sal_id FROM transport_data t JOIN chauffeurs c ON c.employee_id = t.sal_id::varchar LIMIT 2");
    console.log('Match by c.employee_id:', match2.rows);
  } catch(e) { console.error(e); }
  pool.end();
}
run();
