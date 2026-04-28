const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

const TOURNEE_SELECT = `
  SELECT
    td.id::bigint AS id,
    td.otdcode::varchar AS otdcode,
    td.sitcode::varchar AS sitcode,
    td.sal_id::varchar AS sal_id,
    td.toucode::varchar AS toucode,
    td.voydtd::text AS voydtd,
    td.voyhrd::text AS voyhrd,
    td.voyhrf::text AS voyhrf,
    td.voydtf::text AS voydtf,
    td.plakm1::double precision AS plakm1,
    td.plakm2::double precision AS plakm2,
    td.km_tsp::double precision AS km_tsp,
    td.voypal::integer AS voypal,
    td.entnbpal::integer AS entnbpal,
    td.performance_camion::double precision AS performance_camion,
    td.performance_chauffeur::double precision AS performance_chauffeur,
    td.taux_remplissage_pal::double precision AS taux_remplissage_pal,
    td.taux_remplissage_ton::double precision AS taux_remplissage_ton,
    td.otsetat::varchar AS otsetat,
    td.chargement::varchar AS chargement,
    td.camion_code::varchar AS camion_code,
    td.sitechauff::varchar AS sitechauff,
    td.sitecamion::varchar AS sitecamion,
    td.states::text AS states,
    td.otskm2::varchar AS otskm2,
    td.otdhd::varchar AS otdhd,
    td.arrivee_client::text AS arrivee_client,
    td.depart_client::text AS depart_client,
    td.km_arv_client::varchar AS km_arv_client,
    td.km_dernier_client::varchar AS km_dernier_client,
    d.name AS depot_name,
    d.latitude AS depot_lat,
    d.longitude AS depot_lng,
    p.name AS poi_name,
    p.latitude AS poi_lat,
    p.longitude AS poi_lng,
    c.nom AS chauffeur_nom,
    c.prenom AS chauffeur_prenom
  FROM transport_data td
  LEFT JOIN depots d ON d.code = td.sitcode
  LEFT JOIN poi_clients p ON p.code = td.otdcode
  LEFT JOIN chauffeurs c ON c.id = CAST(td.sal_id AS bigint)
`;

const DRIVER_TRIP_HISTORY_SELECT = `
  SELECT
    dt.id::bigint AS id,
    NULL::varchar AS otdcode,
    NULL::varchar AS sitcode,
    dt.chauffeur_id::varchar AS sal_id,
    CONCAT('APP-', dt.id::text) AS toucode,
    TO_CHAR(COALESCE(dt.start_time, dt.created_at), 'YYYY-MM-DD') AS voydtd,
    TO_CHAR(COALESCE(dt.start_time, dt.created_at), 'HH24:MI') AS voyhrd,
    TO_CHAR(COALESCE(dt.end_time, dt.updated_at, NOW()), 'HH24:MI') AS voyhrf,
    TO_CHAR(COALESCE(dt.end_time, dt.updated_at, NOW()), 'YYYY-MM-DD') AS voydtf,
    NULL::double precision AS plakm1,
    NULL::double precision AS plakm2,
    dt.distance_km AS km_tsp,
    NULL::integer AS voypal,
    NULL::integer AS entnbpal,
    NULL::double precision AS performance_camion,
    NULL::double precision AS performance_chauffeur,
    NULL::double precision AS taux_remplissage_pal,
    NULL::double precision AS taux_remplissage_ton,
    'livré'::varchar AS otsetat,
    NULL::varchar AS chargement,
    NULL::varchar AS camion_code,
    CONCAT_WS(' ', c.prenom, c.nom) AS sitechauff,
    NULL::varchar AS sitecamion,
    'done'::text AS states,
    NULL::varchar AS otskm2,
    NULL::varchar AS otdhd,
    NULL::text AS arrivee_client,
    NULL::text AS depart_client,
    NULL::varchar AS km_arv_client,
    NULL::varchar AS km_dernier_client,
    dt.origin AS depot_name,
    dt.origin_lat AS depot_lat,
    dt.origin_lng AS depot_lng,
    dt.destination AS poi_name,
    dt.dest_lat AS poi_lat,
    dt.dest_lng AS poi_lng,
    c.nom AS chauffeur_nom,
    c.prenom AS chauffeur_prenom
  FROM driver_trips dt
  LEFT JOIN chauffeurs c ON c.id = dt.chauffeur_id
`;

function normalizeOptionalCode(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeBooleanFlag(value) {
  if (value == null) {
    return false;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }

  return false;
}

function mapTourneeRow(row) {
  const depot =
    row.depot_name || row.depot_lat != null || row.depot_lng != null
      ? {
          code: row.sitcode,
          name: row.depot_name,
          latitude: row.depot_lat,
          longitude: row.depot_lng,
        }
      : null;

  const poiClient =
    row.poi_name || row.poi_lat != null || row.poi_lng != null
      ? {
          code: row.otdcode,
          name: row.poi_name,
          latitude: row.poi_lat,
          longitude: row.poi_lng,
        }
      : null;

  const chauffeur =
    row.chauffeur_nom || row.chauffeur_prenom
      ? {
          id: row.sal_id,
          nom: row.chauffeur_nom,
          prenom: row.chauffeur_prenom,
        }
      : null;

  return {
    id: row.id,
    otdcode: row.otdcode,
    sitcode: row.sitcode,
    sal_id: row.sal_id,
    toucode: row.toucode,
    voydtd: row.voydtd,
    voyhrd: row.voyhrd,
    voyhrf: row.voyhrf,
    voydtf: row.voydtf,
    plakm1: row.plakm1,
    plakm2: row.plakm2,
    km_tsp: row.km_tsp,
    voypal: row.voypal,
    entnbpal: row.entnbpal,
    performance_camion: row.performance_camion,
    performance_chauffeur: row.performance_chauffeur,
    taux_remplissage_pal: row.taux_remplissage_pal,
    taux_remplissage_ton: row.taux_remplissage_ton,
    otsetat: row.otsetat,
    chargement: row.chargement,
    camion_code: row.camion_code,
    sitechauff: row.sitechauff,
    sitecamion: row.sitecamion,
    states: row.states,
    otskm2: row.otskm2,
    otdhd: row.otdhd,
    arrivee_client: row.arrivee_client,
    depart_client: row.depart_client,
    km_arv_client: row.km_arv_client,
    km_dernier_client: row.km_dernier_client,
    depot_name: row.depot_name,
    depot_lat: row.depot_lat,
    depot_lng: row.depot_lng,
    poi_name: row.poi_name,
    poi_lat: row.poi_lat,
    poi_lng: row.poi_lng,
    chauffeur_nom: row.chauffeur_nom,
    chauffeur_prenom: row.chauffeur_prenom,
    depot,
    poi_client: poiClient,
    chauffeur,
  };
}

router.get('/history', async (req, res, next) => {
  try {
    const sitcode = normalizeOptionalCode(req.query.sitcode);
    const otdcode = normalizeOptionalCode(req.query.otdcode);
    const includeAllDrivers = normalizeBooleanFlag(
      req.query.include_all_drivers ?? req.query.allDrivers
    );

    const { rows } = await db.query(
      `
      SELECT *
      FROM (
        ${TOURNEE_SELECT}
        WHERE ($4::boolean IS TRUE OR CAST(td.sal_id AS bigint) = $1::bigint)
          AND ($2::varchar IS NULL OR td.sitcode = $2::varchar)
          AND ($3::varchar IS NULL OR td.otdcode = $3::varchar)
          AND COALESCE(td.states, 'done') = 'done'

        UNION ALL

        ${DRIVER_TRIP_HISTORY_SELECT}
        WHERE ($4::boolean IS TRUE OR dt.chauffeur_id = $1::bigint)
          AND dt.status = 'done'
          AND $2::varchar IS NULL
          AND $3::varchar IS NULL
      ) history
      ORDER BY history.voydtd DESC NULLS LAST, history.voyhrd DESC NULLS LAST, history.id DESC
      LIMIT 300
      `,
      [req.user.id, sitcode, otdcode, includeAllDrivers]
    );

    return res.json({ tournees: rows.map(mapTourneeRow) });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tourneeId = Number(req.params.id);

    if (!Number.isInteger(tourneeId)) {
      return res.status(400).json({ message: 'Invalid tournee id' });
    }

    const { rows } = await db.query(
      `
      ${TOURNEE_SELECT}
      WHERE CAST(td.sal_id AS bigint) = $1::bigint
        AND td.id = $2::integer
      LIMIT 1
      `,
      [req.user.id, tourneeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tournee not found' });
    }

    return res.json({ tournee: mapTourneeRow(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id/details', async (req, res, next) => {
  try {
    const tourneeId = Number(req.params.id);
    if (!Number.isInteger(tourneeId)) {
      return res.status(400).json({ message: 'Invalid tournee id' });
    }

    // Verify the tournée exists
    const { rows: check } = await db.query(
      `SELECT id FROM transport_data
       WHERE id = $1
       LIMIT 1`,
      [tourneeId]
    );
    if (check.length === 0) {
      return res.status(404).json({ message: 'Tournee not found' });
    }

    const body = req.body || {};
    const updates = [];
    const values = [tourneeId];
    let paramIdx = 2;

    // Allowed updatable fields with their column types
    const fieldMap = {
      chargement:        { col: 'chargement',        type: 'varchar' },
      voyhrd:            { col: 'voyhrd',             type: 'time'    },
      voyhrf:            { col: 'voyhrf',             type: 'time'    },
      plakm1:            { col: 'plakm1',             type: 'numeric' },
      plakm2:            { col: 'plakm2',             type: 'numeric' },
      km_dernier_client: { col: 'km_dernier_client',  type: 'varchar' },
      arrivee_client:    { col: 'arrivee_client',     type: 'time'    },
      depart_client:     { col: 'depart_client',      type: 'time'    },
      km_arv_client:     { col: 'km_arv_client',      type: 'varchar' },
      voypal:            { col: 'voypal',             type: 'integer' },
      otsetat:           { col: 'otsetat',            type: 'varchar' },
    };

    for (const [key, def] of Object.entries(fieldMap)) {
      if (body[key] !== undefined) {
        let val = body[key];
        if (val === '' || val === null) {
          val = null;
        }
        if (def.type === 'time' && val != null) {
          // Accept HH:MM or HH:MM:SS
          const m = String(val).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
          if (!m) continue;
          val = m[3] ? `${m[1]}:${m[2]}:${m[3]}` : `${m[1]}:${m[2]}:00`;
        }
        if (def.type === 'numeric' && val != null) {
          const n = Number(String(val).replace(',', '.'));
          if (!Number.isFinite(n)) continue;
          val = n;
        }
        if (def.type === 'integer' && val != null) {
          const n = parseInt(String(val), 10);
          if (!Number.isFinite(n)) continue;
          val = n;
        }
        updates.push(`${def.col} = $${paramIdx}::${def.type}`);
        values.push(val);
        paramIdx++;
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updates.push(`"updatedAt" = NOW()`);

    const { rows } = await db.query(
      `UPDATE transport_data SET ${updates.join(', ')} WHERE id = $1 RETURNING id`,
      values
    );

    return res.json({ success: true, updated: rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;