const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in Backend_auth/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: truckRows } = await client.query(
      `SELECT camion FROM base_camion ORDER BY camion LIMIT 1`
    );

    if (truckRows.length === 0) {
      throw new Error('base_camion table has no rows. Run 030_populate_base_camion.sql first.');
    }

    const camion = truckRows[0].camion;
    const passwordHash = await bcrypt.hash('driver123', 10);

    await client.query(
      `
      INSERT INTO chauffeurs (nom, prenom, cin, email, tel, employee_id, password_hash, camion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (employee_id)
      DO UPDATE SET
        cin = EXCLUDED.cin,
        password_hash = EXCLUDED.password_hash,
        camion = EXCLUDED.camion,
        updated_at = NOW()
      `,
      [
        'Mansour',
        'Karim',
        'AA123456',
        'karim.mansour@fleet.local',
        '+21620000000',
        'DRV-00412',
        passwordHash,
        camion,
      ]
    );

    await client.query(
      `
      INSERT INTO driver_trips (
        chauffeur_id,
        origin,
        destination,
        origin_lat,
        origin_lng,
        dest_lat,
        dest_lng,
        status,
        distance_km,
        duration_minutes,
        start_time,
        end_time
      )
      SELECT
        c.id,
        $2::varchar,
        $3::varchar,
        $4::double precision,
        $5::double precision,
        $6::double precision,
        $7::double precision,
        $8::varchar,
        $9::double precision,
        $10::integer,
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '1 hour'
      FROM chauffeurs c
      WHERE c.employee_id = $1::varchar
        AND NOT EXISTS (
          SELECT 1
          FROM driver_trips t
          WHERE t.chauffeur_id = c.id
            AND t.status = 'done'
            AND t.origin = $2::varchar
            AND t.destination = $3::varchar
        )
      `,
      [
        'DRV-00412',
        'Tunis Centre',
        'Sousse Port',
        36.8065,
        10.1815,
        35.8256,
        10.6369,
        'done',
        142,
        98,
      ]
    );

    await client.query(
      `
      INSERT INTO driver_trips (
        chauffeur_id,
        origin,
        destination,
        origin_lat,
        origin_lng,
        dest_lat,
        dest_lng,
        status,
        distance_km,
        duration_minutes
      )
      SELECT
        c.id,
        $2::varchar,
        $3::varchar,
        $4::double precision,
        $5::double precision,
        $6::double precision,
        $7::double precision,
        $8::varchar,
        $9::double precision,
        $10::integer
      FROM chauffeurs c
      WHERE c.employee_id = $1::varchar
        AND NOT EXISTS (
          SELECT 1
          FROM driver_trips t
          WHERE t.chauffeur_id = c.id
            AND t.status IN ('pending', 'active')
        )
      `,
      [
        'DRV-00412',
        'Tunis Centre',
        'Sfax Industrial Zone',
        36.8065,
        10.1815,
        34.7400,
        10.7600,
        'pending',
        248,
        134,
      ]
    );

    await client.query('COMMIT');

    console.log('Seed complete.');
    console.log('Demo login:');
    console.log('employee_id = DRV-00412');
    console.log('password    = AA123456 (cin)');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
