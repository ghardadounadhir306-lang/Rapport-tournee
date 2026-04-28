require('dotenv').config();
const { pool } = require('./src/db');
async function run() {
  try {
    const q1 = "SELECT count(*) FROM transport_data t LEFT JOIN chauffeurs c ON c.id=CAST(t.sal_id AS bigint) WHERE c.id IS NULL";
    const res1 = await pool.query(q1);
    console.log('Unmatched sal_id rows:', res1.rows[0].count);
  } finally { pool.end(); }
}
run();
