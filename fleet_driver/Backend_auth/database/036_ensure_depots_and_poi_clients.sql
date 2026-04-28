-- ============================================================
-- SCHEMA: Table relationships for transport_data
--
-- transport_data.sal_id    → chauffeurs.id       (FK: chauffeur)
-- transport_data.otdcode   → poi_clients.code    (FK: destination/client)
-- transport_data.sitcode   → depots.code         (FK: origin/depot)
-- transport_data.camion_code → base_camion.camion (FK: truck)
-- chauffeurs.camion        → base_camion.camion   (FK: assigned truck)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Table: depots (origin sites - linked via sitcode)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS depots (
  id        BIGSERIAL    PRIMARY KEY,
  code      VARCHAR(64)  NOT NULL UNIQUE,   -- matches transport_data.sitcode
  name      VARCHAR(255),
  address   TEXT,
  city      VARCHAR(128),
  latitude  DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_depots_code ON depots (code);

-- ────────────────────────────────────────────────────────────
-- 2. Table: poi_clients (destination clients - linked via otdcode)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poi_clients (
  id        BIGSERIAL    PRIMARY KEY,
  code      VARCHAR(64)  NOT NULL UNIQUE,   -- matches transport_data.otdcode
  name      VARCHAR(255),
  address   TEXT,
  city      VARCHAR(128),
  latitude  DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  client_type VARCHAR(64),                  -- type de client (magasin, entrepot, etc.)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_poi_clients_code ON poi_clients (code);

-- ────────────────────────────────────────────────────────────
-- 3. Table: chauffeurs (already exists - reminder of structure)
-- ────────────────────────────────────────────────────────────
-- chauffeurs has: id, nom, prenom, cin, email, tel, employee_id, camion
-- transport_data.sal_id → chauffeurs.id
-- chauffeurs.camion → base_camion.camion

-- ────────────────────────────────────────────────────────────
-- 4. Table: base_camion (already exists - reminder of structure)
-- ────────────────────────────────────────────────────────────
-- base_camion has: camion (PK), type, marque, ...
-- transport_data.camion_code → base_camion.camion

-- ────────────────────────────────────────────────────────────
-- 5. Populate depots from transport_data (extract unique sitcodes)
-- ────────────────────────────────────────────────────────────
INSERT INTO depots (code, name, latitude, longitude)
SELECT DISTINCT
  td.sitcode,
  COALESCE(td.sitcode, 'Depot ' || td.sitcode),
  0.0,
  0.0
FROM transport_data td
WHERE td.sitcode IS NOT NULL
  AND td.sitcode != ''
  AND NOT EXISTS (
    SELECT 1 FROM depots d WHERE d.code = td.sitcode
  )
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 6. Populate poi_clients from transport_data (extract unique otdcodes)
-- ────────────────────────────────────────────────────────────
INSERT INTO poi_clients (code, name, latitude, longitude)
SELECT DISTINCT
  td.otdcode,
  COALESCE(td.otdcode, 'Client ' || td.otdcode),
  0.0,
  0.0
FROM transport_data td
WHERE td.otdcode IS NOT NULL
  AND td.otdcode != ''
  AND NOT EXISTS (
    SELECT 1 FROM poi_clients p WHERE p.code = td.otdcode
  )
ON CONFLICT (code) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 7. Diagnostic: Verify the relationships work
-- ────────────────────────────────────────────────────────────

-- Check how many transport_data rows link to existing depots
-- SELECT 
--   COUNT(*) AS total_records,
--   COUNT(d.id) AS matched_depots,
--   COUNT(*) - COUNT(d.id) AS unmatched_depots
-- FROM transport_data td
-- LEFT JOIN depots d ON d.code = td.sitcode;

-- Check how many transport_data rows link to existing poi_clients
-- SELECT 
--   COUNT(*) AS total_records,
--   COUNT(p.id) AS matched_poi_clients,
--   COUNT(*) - COUNT(p.id) AS unmatched_poi_clients
-- FROM transport_data td
-- LEFT JOIN poi_clients p ON p.code = td.otdcode;

-- Check how many transport_data rows link to existing chauffeurs
-- SELECT 
--   COUNT(*) AS total_records,
--   COUNT(c.id) AS matched_chauffeurs,
--   COUNT(*) - COUNT(c.id) AS unmatched_chauffeurs
-- FROM transport_data td
-- LEFT JOIN chauffeurs c ON c.id = CAST(td.sal_id AS bigint);

-- ────────────────────────────────────────────────────────────
-- 8. Full test query (same as backend uses)
-- ────────────────────────────────────────────────────────────
-- SELECT
--   td.id,
--   td.otdcode,
--   td.sitcode,
--   td.sal_id,
--   td.voydtd,
--   td.voyhrd,
--   td.voyhrf,
--   td.voypal,
--   td.otsetat,
--   td.camion_code,
--   td.sitechauff,
--   td.sitecamion,
--   d.name  AS depot_name,
--   d.latitude  AS depot_lat,
--   d.longitude AS depot_lng,
--   p.name  AS poi_name,
--   p.latitude  AS poi_lat,
--   p.longitude AS poi_lng,
--   c.nom    AS chauffeur_nom,
--   c.prenom AS chauffeur_prenom,
--   c.employee_id AS chauffeur_employee_id
-- FROM transport_data td
-- LEFT JOIN depots d ON d.code = td.sitcode
-- LEFT JOIN poi_clients p ON p.code = td.otdcode
-- LEFT JOIN chauffeurs c ON c.id = CAST(td.sal_id AS bigint)
-- ORDER BY td.voydtd DESC NULLS LAST
-- LIMIT 20;
