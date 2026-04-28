const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'postgres',
  password: 'postgres',
  port: 5433,
});

async function run() {
  await client.connect();
  
  await client.query(`
    UPDATE "tms_form_data" 
    SET km_facture = '68',
        h_depart = '08:00',
        h_retour = '09:42',
        updated_at = NOW()
    WHERE wms = '0';
  `);
  console.log('Updated WMS 0 to precisely match Theoretical KM and Estimated Time.');

  await client.end();
}

run().catch(console.error);
