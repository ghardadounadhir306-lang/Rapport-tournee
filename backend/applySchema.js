const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applySchema() {
  let client = null;
  
  try {
    client = new Client({
      user: 'postgres',
      host: '127.0.0.1',
      database: 'postgres',
      password: 'postgres',
      port: 5433,
    });

    await client.connect();
    console.log('✅ Connected to server');
    
    // Find tarif_aziza database
    const dbResult = await client.query("SELECT datname FROM pg_database WHERE datname = 'tarif_aziza'");
    if (dbResult.rows.length === 0) {
      throw new Error('Database tarif_aziza not found');
    }
    
    console.log('🎯 Found tarif_aziza database');
    await client.end();

    // Connect to tarif_aziza and apply master schema
    const dbClient = new Client({
      user: 'postgres',
      host: '127.0.0.1',
      database: 'tarif_aziza',
      password: 'postgres',
      port: 5433,
    });
    
    await dbClient.connect();
    console.log('✅ Connected to tarif_aziza');
    
    const schemaFile = path.join(__dirname, 'sql', 'patches', '000_master_clean_schema.sql');
    const schema = fs.readFileSync(schemaFile, 'utf8');

    console.log('\n📝 Applying master schema...');
    await dbClient.query(schema);
    console.log('✅ Schema applied successfully!');

    // List tables
    const tablesResult = await dbClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`\n📋 Tables created (${tablesResult.rows.length}):`);
    tablesResult.rows.forEach(r => console.log(`  - ${r.table_name}`));

    await dbClient.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applySchema();
