const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

const TRIP_SELECT_COLUMNS = `
  id,
  transport_data_id,
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
`;

function toFiniteNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function parseLocationPayload(body, { requireCoordinates = false } = {}) {
  const payload = body && typeof body === 'object' ? body : {};
  const hasLat = Object.prototype.hasOwnProperty.call(payload, 'lat');
  const hasLng = Object.prototype.hasOwnProperty.call(payload, 'lng');
  const hasSpeed = Object.prototype.hasOwnProperty.call(payload, 'speed');

  const lat = hasLat ? toFiniteNumber(payload.lat) : null;
  const lng = hasLng ? toFiniteNumber(payload.lng) : null;
  const speed = hasSpeed ? toFiniteNumber(payload.speed) : null;

  if (hasLat && lat == null) {
    return { error: 'lat must be a number' };
  }

  if (hasLng && lng == null) {
    return { error: 'lng must be a number' };
  }

  if (hasSpeed && speed == null) {
    return { error: 'speed must be a number' };
  }

  if ((lat == null) !== (lng == null)) {
    return { error: 'lat and lng must be provided together' };
  }

  if (requireCoordinates && (lat == null || lng == null)) {
    return { error: 'lat and lng are required as numbers' };
  }

  return { lat, lng, speed, error: null };
}

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function calculatePathDistanceKm(rows) {
  if (!Array.isArray(rows) || rows.length < 2) {
    return 0;
  }

  let totalKm = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const prevLat = toFiniteNumber(rows[i - 1].lat);
    const prevLng = toFiniteNumber(rows[i - 1].lng);
    const currLat = toFiniteNumber(rows[i].lat);
    const currLng = toFiniteNumber(rows[i].lng);

    if (
      prevLat == null ||
      prevLng == null ||
      currLat == null ||
      currLng == null
    ) {
      continue;
    }

    totalKm += haversineDistanceKm(prevLat, prevLng, currLat, currLng);
  }

  return Number(totalKm.toFixed(2));
}

async function resolveTransportDataId(client, tripId, chauffeurId, origin, destination) {
  const { rows } = await client.query(
    `
    SELECT transport_data_id
    FROM driver_trips
    WHERE id = $1 AND chauffeur_id = $2
    LIMIT 1
    `,
    [tripId, chauffeurId]
  );

  const directId = rows[0]?.transport_data_id;
  if (directId != null) {
    return Number(directId);
  }

  const { rows: fallbackRows } = await client.query(
    `
    SELECT id
    FROM transport_data
    WHERE sal_id = $1::bigint
      AND sitcode = $2::varchar
      AND otdcode = $3::varchar
    ORDER BY "createdAt" DESC NULLS LAST, id DESC
    LIMIT 1
    `,
    [chauffeurId, origin, destination]
  );

  return fallbackRows[0]?.id ? Number(fallbackRows[0].id) : null;
}

router.get('/active', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        ${TRIP_SELECT_COLUMNS}
      FROM driver_trips
      WHERE chauffeur_id = $1
        AND status IN ('pending', 'active')
      ORDER BY
        CASE WHEN status = 'active' THEN 0 ELSE 1 END,
        created_at DESC
      LIMIT 1
      `,
      [req.user.id]
    );

    return res.json({ trip: rows[0] || null });
  } catch (error) {
    return next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        ${TRIP_SELECT_COLUMNS}
      FROM driver_trips
      WHERE chauffeur_id = $1
        AND status = 'done'
      ORDER BY COALESCE(end_time, created_at) DESC
      LIMIT 100
      `,
      [req.user.id]
    );

    return res.json({ trips: rows });
  } catch (error) {
    return next(error);
  }
});

router.post('/:tripId/start', async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    const tripId = Number(req.params.tripId);
    const location = parseLocationPayload(req.body);

    if (!Number.isInteger(tripId)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }

    if (location.error) {
      return res.status(400).json({ message: location.error });
    }

    await client.query('BEGIN');

    const { rows } = await client.query(
      `
      UPDATE driver_trips
      SET
        status = 'active',
        start_time = COALESCE(start_time, NOW()),
        origin_lat = COALESCE(origin_lat, $3::double precision),
        origin_lng = COALESCE(origin_lng, $4::double precision),
        updated_at = NOW()
      WHERE id = $1
        AND chauffeur_id = $2
        AND status IN ('pending', 'active')
      RETURNING ${TRIP_SELECT_COLUMNS}
      `,
      [tripId, req.user.id, location.lat, location.lng]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Trip not found or not startable' });
    }

    if (location.lat != null && location.lng != null) {
      await client.query(
        `
        INSERT INTO driver_trip_locations (trip_id, lat, lng, speed)
        VALUES ($1, $2, $3, $4)
        `,
        [tripId, location.lat, location.lng, location.speed]
      );
    }

    const transportDataId = await resolveTransportDataId(
      client,
      tripId,
      req.user.id,
      rows[0].origin,
      rows[0].destination
    );

    if (transportDataId != null) {
      await client.query(
        `
        UPDATE transport_data
        SET
          states = 'active',
          voyhrd = COALESCE(voyhrd, NOW()::time),
          "updatedAt" = NOW()
        WHERE id = $1
        `,
        [transportDataId]
      );
    }

    await client.query('COMMIT');

    return res.json({ trip: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.post('/:tripId/end', async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    const tripId = Number(req.params.tripId);
    const location = parseLocationPayload(req.body);

    if (!Number.isInteger(tripId)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }

    if (location.error) {
      return res.status(400).json({ message: location.error });
    }

    await client.query('BEGIN');

    const { rows } = await client.query(
      `
      UPDATE driver_trips
      SET
        status = 'done',
        end_time = COALESCE(end_time, NOW()),
        dest_lat = COALESCE($3::double precision, dest_lat),
        dest_lng = COALESCE($4::double precision, dest_lng),
        duration_minutes = COALESCE(
          duration_minutes,
          GREATEST(
            1,
            FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(start_time, NOW()))) / 60)::integer
          )
        ),
        updated_at = NOW()
      WHERE id = $1
        AND chauffeur_id = $2
        AND status IN ('pending', 'active')
      RETURNING ${TRIP_SELECT_COLUMNS}
      `,
      [tripId, req.user.id, location.lat, location.lng]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Trip not found or not endable' });
    }

    if (location.lat != null && location.lng != null) {
      await client.query(
        `
        INSERT INTO driver_trip_locations (trip_id, lat, lng, speed)
        VALUES ($1, $2, $3, $4)
        `,
        [tripId, location.lat, location.lng, location.speed]
      );
    }

    const transportDataId = await resolveTransportDataId(
      client,
      tripId,
      req.user.id,
      rows[0].origin,
      rows[0].destination
    );

    const { rows: pathRows } = await client.query(
      `
      SELECT lat, lng
      FROM driver_trip_locations
      WHERE trip_id = $1
      ORDER BY id ASC
      `,
      [tripId]
    );

    const computedDistanceKm = calculatePathDistanceKm(pathRows);
    if (computedDistanceKm > 0) {
      await client.query(
        `
        UPDATE driver_trips
        SET
          distance_km = $2::double precision,
          updated_at = NOW()
        WHERE id = $1
        `,
        [tripId, computedDistanceKm]
      );
      rows[0].distance_km = computedDistanceKm;
    }

    if (transportDataId != null) {
      await client.query(
        `
        UPDATE transport_data
        SET
          states = 'done',
          voyhrf = COALESCE(voyhrf, NOW()::time),
          voydtf = NOW()::date,
          km_tsp = COALESCE($2::double precision, km_tsp),
          "updatedAt" = NOW()
        WHERE id = $1
        `,
        [transportDataId, computedDistanceKm > 0 ? computedDistanceKm : null]
      );
    }

    await client.query('COMMIT');

    return res.json({ success: true, trip: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return next(error);
  } finally {
    client.release();
  }
});

router.post('/:tripId/locations', async (req, res, next) => {
  try {
    const tripId = Number(req.params.tripId);
    const location = parseLocationPayload(req.body, { requireCoordinates: true });

    if (!Number.isInteger(tripId)) {
      return res.status(400).json({ message: 'Invalid trip id' });
    }

    if (location.error) {
      return res.status(400).json({ message: location.error });
    }

    const { rows: tripRows } = await db.query(
      `SELECT id FROM driver_trips WHERE id = $1 AND chauffeur_id = $2 AND status = 'active' LIMIT 1`,
      [tripId, req.user.id]
    );

    if (tripRows.length === 0) {
      return res.status(404).json({ message: 'Active trip not found' });
    }

    await db.query(
      `
      INSERT INTO driver_trip_locations (trip_id, lat, lng, speed)
      VALUES ($1, $2, $3, $4)
      `,
      [tripId, location.lat, location.lng, location.speed]
    );

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
