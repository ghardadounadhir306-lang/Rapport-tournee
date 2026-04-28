const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let client = null;
  let dbClient = null;
  
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
    
    const dbResult = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
    const databases = dbResult.rows.map(r => r.datname);
    console.log('📚 Available databases:', databases.join(', '));
    
    let targetDb = databases.includes('tarif_aziza') ? 'tarif_aziza' : 
                   databases.find(db => db !== 'postgres');
    
    if (!targetDb) {
      throw new Error('No suitable database found');
    }
    
    console.log(`\n🎯 Using database: ${targetDb}`);
    await client.end();

    dbClient = new Client({
      user: 'postgres',
      host: '127.0.0.1',
      database: targetDb,
      password: 'postgres',
      port: 5433,
    });
    
    await dbClient.connect();
    console.log(`✅ Connected to ${targetDb}`);
    
    const tablesResult = await dbClient.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tables:', tablesResult.rows.map(r => r.table_name).join(', '));
    
    if (!tablesResult.rows.some(r => r.table_name === 'base_camion')) {
      console.log('\n⚠️  base_camion table does not exist. Skipping migration.');
      return;
    }

    const sqlFile = path.join(__dirname, 'sql', 'patches', '030_populate_base_camion.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\n📝 Running migration: 030_populate_base_camion.sql');
    await dbClient.query(sql);
    console.log('✅ Migration completed successfully!');

    const result = await dbClient.query('SELECT COUNT(*) as truck_count FROM base_camion');
    console.log(`📊 Total trucks in base_camion: ${result.rows[0].truck_count}`);

    await dbClient.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (client) await client.end().catch(() => {});
    if (dbClient) await dbClient.end().catch(() => {});
    process.exit(1);
  }
}

runMigration();
