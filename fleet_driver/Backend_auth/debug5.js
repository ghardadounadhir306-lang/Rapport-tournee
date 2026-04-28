require('dotenv').config();
const { pool } = require('./src/db');
async function run() {
  try {
    const data = await pool.query("SELECT id, otsetat, cdate, voydtd, voyhrd, voydtf, voyhrf, voycle, artcode, otdcode, sitcode FROM transport_data LIMIT 10");
    console.log(data.rows);
  } finally { pool.end(); }
}
run();
