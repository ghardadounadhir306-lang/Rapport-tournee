const { Client } = require('pg');

async function check() {
  const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'tarif_aziza',
    password: 'postgres',
    port: 5433,
  });
  
  try {
    await client.connect();
    
    // Count total trucks
    const countRes = await client.query('SELECT COUNT(*) as total FROM base_camion');
    console.log(`📊 Total trucks in base_camion: ${countRes.rows[0].total}`);
    
    // Show sample of new trucks
    const sampleRes = await client.query(
      `SELECT camion, marque, site, type, capacite FROM base_camion 
       WHERE camion LIKE '%TU%' OR camion = 'CHFR_PARC'
       ORDER BY camion LIMIT 10`
    );
    
    console.log('\n📋 Sample of loaded trucks:');
    sampleRes.rows.forEach(row => {
      console.log(`  ${row.camion} | ${row.marque} | ${row.site} | ${row.type} | ${row.capacite}T`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌', error.message);
  }
}

check();
