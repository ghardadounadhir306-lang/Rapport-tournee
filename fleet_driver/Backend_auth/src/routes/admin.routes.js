const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Middleware: Check if super_admin
async function checkSuperAdmin(req, res, next) {
  try {
    const result = await db.query(
      'SELECT role FROM chauffeurs WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0 || result.rows[0].role !== 'super_admin') {
      return res.status(403).json({ message: 'Access denied. Super admin required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking permissions' });
  }
}

async function resolveChauffeurId(rawSalId) {
  if (rawSalId == null) {
    return null;
  }

  const asText = String(rawSalId).trim();
  if (!asText) {
    return null;
  }

  if (/^\d+$/.test(asText)) {
    return Number(asText);
  }

  const { rows } = await db.query(
    'SELECT id FROM chauffeurs WHERE employee_id = $1 LIMIT 1',
    [asText]
  );

  if (rows.length === 0) {
    return null;
  }

  return Number(rows[0].id);
}

// GET: List pending trips (states = 'pending')
router.get('/trips-pending', checkSuperAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        id::bigint,
        otdcode,
        sitcode,
        sal_id,
        toucode,
        voydtd,
        voyhrd,
        NULL::text AS voyhrf,
        voydtf,
        voypal,
        entnbpal,
        camion_code,
        sitechauff,
        sitecamion,
        states
      FROM transport_data
      WHERE states = 'pending'
      ORDER BY voydtd DESC, voyhrd DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching pending trips' });
  }
});

// POST: Create new trip
router.post('/trips', checkSuperAdmin, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const {
      otdcode,    // destination code
      sitcode,    // origin depot code
      sal_id,     // chauffeur id or employee_id
      toucode,    // tournée code
      voydtd,     // date départ
      voyhrd,     // heure départ
      voydtf,     // date fin
      camion_code,
      chargement,
    } = req.body;

    // Validate required fields
    if (!otdcode || !sitcode || !sal_id || !voydtd) {
      return res.status(400).json({ 
        message: 'Missing required fields: otdcode, sitcode, sal_id, voydtd' 
      });
    }

    const chauffeurId = await resolveChauffeurId(sal_id);
    if (!chauffeurId) {
      return res.status(400).json({
        message: 'Invalid sal_id. Use numeric chauffeur id or valid employee_id.',
      });
    }

    await client.query('BEGIN');

    const { rows: idRows } = await client.query(
      'SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM transport_data'
    );
    const nextId = Number(idRows[0].next_id);
    const tripCode = toucode || `TRN-${Date.now()}`;

    const result = await client.query(`
      INSERT INTO transport_data (
        id, otdcode, sitcode, sal_id, toucode, voydtd, voyhrd, voydtf,
        camion_code, chargement, states, "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, toucode, states
    `, [
      nextId,
      otdcode,
      sitcode,
      chauffeurId,
      tripCode,
      voydtd,
      voyhrd,
      voydtf,
      camion_code,
      chargement,
      'pending',
    ]);
    const transportDataId = Number(result.rows[0].id);

    // Keep mobile "Today's Assignment" in sync (it reads from driver_trips)
    await client.query(
      `
      INSERT INTO driver_trips (
        transport_data_id,
        chauffeur_id,
        origin,
        destination,
        status,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW())
      `,
      [transportDataId, chauffeurId, sitcode, otdcode]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Trip created successfully',
      trip: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error creating trip', error: error.message });
  } finally {
    client.release();
  }
});

// PATCH: Update trip state (pending -> done)
router.patch('/trips/:id/state', checkSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { states } = req.body;

    if (!states || !['pending', 'done'].includes(states)) {
      return res.status(400).json({ 
        message: 'Invalid state. Must be "pending" or "done"' 
      });
    }

    const result = await db.query(`
      UPDATE transport_data
      SET
        states = $1,
        voyhrf = COALESCE(voyhrf, NOW()::time),
        voydtf = COALESCE(voydtf, NOW()::date),
        km_tsp = COALESCE(km_tsp, 0),
        "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id, states, sal_id, sitcode, otdcode
    `, [states, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const updated = result.rows[0];

    // Sync the latest corresponding driver_trips row to keep mobile state aligned.
    await db.query(
      `
      WITH latest_trip AS (
        SELECT id
        FROM driver_trips
        WHERE chauffeur_id = $1
          AND origin = $2
          AND destination = $3
        ORDER BY created_at DESC
        LIMIT 1
      )
      UPDATE driver_trips
      SET
        status = $4,
        end_time = CASE WHEN $4 = 'done' THEN COALESCE(end_time, NOW()) ELSE NULL END,
        updated_at = NOW()
      WHERE id IN (SELECT id FROM latest_trip)
      `,
      [updated.sal_id, updated.sitcode, updated.otdcode, states]
    );

    res.json({
      message: 'Trip state updated',
      trip: updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating trip state' });
  }
});

module.exports = router;
