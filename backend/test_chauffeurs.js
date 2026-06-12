const { Client } = require('pg');
async function main() {
  const client = new Client({ host:'127.0.0.1', port:5433, user:'postgres', password:'postgres', database:'postgres' });
  await client.connect();

  // Sample otsetat values  
  const r1 = await client.query(`SELECT DISTINCT otsetat FROM transport_data WHERE otsetat IS NOT NULL AND TRIM(otsetat) <> '' LIMIT 20`);
  console.log('otsetat values:', r1.rows.map(r => r.otsetat));

  // Test full query
  const r2 = await client.query(`
    SELECT COUNT(*) FROM chauffeurs c
    LEFT JOIN (
      SELECT sal_id, COUNT(*) AS cnt FROM transport_data WHERE sal_id IS NOT NULL GROUP BY sal_id
    ) s ON s.sal_id::bigint = c.id
  `);
  console.log('JOIN count:', r2.rows[0].count);

  await client.end();
}
main().catch(e => console.error('ERROR:', e.message));
