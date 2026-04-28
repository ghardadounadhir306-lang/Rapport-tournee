-- ============================================================
-- MASTER CONSOLIDATED SCHEMA
-- Final aggregation of all patches for clean production schema
-- Removed: tms_form_data, gps_points, anomalies (table), v_tournee_optimisation
-- Kept: transport_data, depots, poi_clients, tour_leg_km_samples, base_tarif*, etc.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. STAGING & REFERENCE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS tms_import_rows (
  id BIGSERIAL PRIMARY KEY,
  affcode VARCHAR(64) NULL,
  artcode VARCHAR(64) NULL,
  cdate DATE NULL,
  entnbpal INT NULL,
  otdcode VARCHAR(64) NULL,
  otscontainer VARCHAR(64) NULL,
  otsetat VARCHAR(64) NULL,
  otskm2 NUMERIC NULL,
  otsnumbdx INTEGER NULL,
  ottmt VARCHAR(64) NULL,
  placha1i VARCHAR(64) NULL,
  plakm1 NUMERIC NULL,
  plakm2 NUMERIC NULL,
  plalib TEXT NULL,
  plamoti TEXT NULL,
  plargiarr TEXT NULL,
  rgilibl TEXT NULL,
  salnom TEXT NULL,
  saltel VARCHAR(64) NULL,
  sitcode VARCHAR(64) NULL,
  sitsiretedi VARCHAR(32) NULL,
  tiecode VARCHAR(64) NULL,
  toucode VARCHAR(64) NULL,
  voycle TEXT NULL,
  voydtd TIMESTAMP NULL,
  voyhrd VARCHAR(32) NULL,
  voyhrf VARCHAR(32) NULL,
  voypal INT NULL,
  performance_camion NUMERIC NULL,
  performance_chauffeur NUMERIC NULL,
  taux_remplissage_pal NUMERIC NULL,
  taux_remplissage_ton NUMERIC NULL,
  mdate TIMESTAMP NULL,
  sitechauff VARCHAR(64) NULL,
  sitecamion VARCHAR(64) NULL,
  salmemoe TEXT NULL,
  otsnum TEXT NULL,
  platouordre INT NULL,
  salmobilite VARCHAR(64) NULL,
  km_tsp NUMERIC NULL,
  toutrafcode VARCHAR(64) NULL,
  chargement TEXT NULL,
  voydtf DATE NULL,
  otdhd TEXT NULL,
  voymemo TEXT NULL,
  raw_json JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_tms_import_otsnum ON tms_import_rows (otsnum);
CREATE INDEX IF NOT EXISTS ix_tms_import_toucode ON tms_import_rows (toucode);
CREATE INDEX IF NOT EXISTS ix_tms_import_cdate ON tms_import_rows (cdate);

-- ============================================================
-- 2. USER & AUDIT
-- ============================================================

CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(32) NOT NULL DEFAULT 'user',
  password_hash VARCHAR(255) NOT NULL,
  matricule VARCHAR(64) NULL,
  allowed_pages TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  action VARCHAR(64) NOT NULL,
  actor_email VARCHAR(255) NULL,
  actor_user_id INT NULL,
  target_type VARCHAR(64) NULL,
  target_id VARCHAR(255) NULL,
  details JSONB NULL,
  ip VARCHAR(64) NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs (action);

-- ============================================================
-- 3. OPERATIONAL: DEPOTS & CLIENTS (POIs)
-- ============================================================

CREATE TABLE IF NOT EXISTS depots (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  nom TEXT NULL,
  adresse TEXT NULL,
  ville VARCHAR(255) NULL,
  codepostal VARCHAR(32) NULL,
  telephone VARCHAR(64) NULL,
  email VARCHAR(255) NULL,
  lat NUMERIC NULL,
  lng NUMERIC NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_depots_code ON depots (code);

CREATE TABLE IF NOT EXISTS poi_clients (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  nom TEXT NULL,
  adresse TEXT NULL,
  ville VARCHAR(255) NULL,
  codepostal VARCHAR(32) NULL,
  telephone VARCHAR(64) NULL,
  email VARCHAR(255) NULL,
  lat NUMERIC NULL,
  lng NUMERIC NULL,
  is_depot BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE poi_clients
  ADD COLUMN IF NOT EXISTS is_depot BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE poi_clients
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS ix_poi_clients_code ON poi_clients (code);
CREATE INDEX IF NOT EXISTS ix_poi_clients_is_depot ON poi_clients (is_depot);

-- ============================================================
-- 4. TRANSPORT MASTER DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS transport_sites (
  id SERIAL PRIMARY KEY,
  sitcode VARCHAR(64) NOT NULL UNIQUE,
  normalized_code VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transport_data (
  id SERIAL PRIMARY KEY,
  affcode TEXT NULL,
  artcode TEXT NULL,
  cdate TIMESTAMP NULL,
  entnbpal INTEGER NULL,
  otdcode TEXT NULL,
  otscontainer TEXT NULL,
  otsetat TEXT NULL,
  states TEXT NOT NULL DEFAULT 'pending' CHECK (states IN ('pending', 'done')),
  otskm2 NUMERIC NULL,
  otsnumbdx INTEGER NULL,
  ottmt TEXT NULL,
  placha1i TEXT NULL,
  plakm1 NUMERIC NULL,
  plakm2 NUMERIC NULL,
  plalib TEXT NULL,
  plamoti TEXT NULL,
  camion_code VARCHAR(128) NULL,
  sal_id BIGINT NULL,
  plargiarr TEXT NULL,
  rgilibl TEXT NULL,
  sitcode TEXT NULL,
  sitsiretedi TEXT NULL,
  tiecode TEXT NULL,
  toucode TEXT NULL,
  voycle TEXT NULL,
  voydtd DATE NULL,
  voyhrd TIME NULL,
  voypal INTEGER NULL,
  performance_camion NUMERIC NULL,
  performance_chauffeur NUMERIC NULL,
  taux_remplissage_pal NUMERIC NULL,
  taux_remplissage_ton NUMERIC NULL,
  mdate TIMESTAMP NULL,
  sitechauff TEXT NULL,
  sitecamion TEXT NULL,
  salmemoe TEXT NULL,
  otsnum TEXT NULL,
  platouordre TEXT NULL,
  salmobilite TEXT NULL,
  km_tsp NUMERIC NULL,
  toutrafcode TEXT NULL,
  chargement TEXT NULL,
  voydtf DATE NULL,
  otdhd TEXT NULL,
  voymemo TEXT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_transport_data_otdcode ON transport_data (otdcode);
CREATE INDEX IF NOT EXISTS ix_transport_data_tiecode ON transport_data (tiecode);
CREATE INDEX IF NOT EXISTS ix_transport_data_sitcode ON transport_data (sitcode);
CREATE INDEX IF NOT EXISTS ix_transport_data_toucode ON transport_data (toucode);
CREATE INDEX IF NOT EXISTS ix_transport_data_camion_code ON transport_data (camion_code);
CREATE INDEX IF NOT EXISTS ix_transport_data_sal_id ON transport_data (sal_id);

-- ============================================================
-- 5. TRANSPORT JUNCTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS transport_depots (
  transport_id INTEGER NOT NULL REFERENCES transport_data(id) ON DELETE CASCADE,
  depot_id BIGINT NOT NULL REFERENCES depots(id) ON DELETE CASCADE,
  PRIMARY KEY (transport_id, depot_id)
);

CREATE INDEX IF NOT EXISTS ix_transport_depots_transport ON transport_depots (transport_id);
CREATE INDEX IF NOT EXISTS ix_transport_depots_depot ON transport_depots (depot_id);

CREATE TABLE IF NOT EXISTS transport_poi_clients (
  transport_id INTEGER NOT NULL REFERENCES transport_data(id) ON DELETE CASCADE,
  poi_client_id BIGINT NOT NULL REFERENCES poi_clients(id) ON DELETE CASCADE,
  PRIMARY KEY (transport_id, poi_client_id)
);

CREATE INDEX IF NOT EXISTS ix_transport_poi_clients_transport ON transport_poi_clients (transport_id);
CREATE INDEX IF NOT EXISTS ix_transport_poi_clients_client ON transport_poi_clients (poi_client_id);

-- ============================================================
-- 6. REFERENCE TABLES: BASE CAMION & TARIF
-- ============================================================

CREATE TABLE IF NOT EXISTS base_camion (
  id BIGSERIAL PRIMARY KEY,
  camion VARCHAR(128) NOT NULL UNIQUE,
  marque VARCHAR(255) NULL,
  site VARCHAR(128) NULL,
  type VARCHAR(128) NULL,
  affectation VARCHAR(255) NULL,
  capacite VARCHAR(64) NULL,
  utile VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_base_camion_site ON base_camion (site);
CREATE INDEX IF NOT EXISTS ix_base_camion_type ON base_camion (type);

CREATE TABLE IF NOT EXISTS chauffeurs (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  cin VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  tel VARCHAR(64) NULL
);

CREATE INDEX IF NOT EXISTS ix_chauffeurs_nom ON chauffeurs (nom);
CREATE INDEX IF NOT EXISTS ix_chauffeurs_prenom ON chauffeurs (prenom);
CREATE INDEX IF NOT EXISTS ix_chauffeurs_tel ON chauffeurs (tel);

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS camion_code VARCHAR(128) NULL;

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS sal_id BIGINT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_transport_data_camion_code'
  ) THEN
    ALTER TABLE transport_data
      ADD CONSTRAINT fk_transport_data_camion_code
      FOREIGN KEY (camion_code)
      REFERENCES base_camion (camion)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_transport_data_sal_id'
  ) THEN
    ALTER TABLE transport_data
      ADD CONSTRAINT fk_transport_data_sal_id
      FOREIGN KEY (sal_id)
      REFERENCES chauffeurs (id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS base_tarif (
  id BIGSERIAL PRIMARY KEY,
  client_code VARCHAR(64) NOT NULL,
  tarif NUMERIC NULL,
  devise VARCHAR(32) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_base_tarif_client_code ON base_tarif (client_code);

CREATE TABLE IF NOT EXISTS base_tarif_effective_date (
  id BIGSERIAL PRIMARY KEY,
  client_code VARCHAR(64) NOT NULL,
  tarif NUMERIC NULL,
  devise VARCHAR(32) NULL,
  date_debut DATE NULL,
  date_fin DATE NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_base_tarif_eff_client ON base_tarif_effective_date (client_code);
CREATE INDEX IF NOT EXISTS ix_base_tarif_eff_dates ON base_tarif_effective_date (date_debut, date_fin);

CREATE TABLE IF NOT EXISTS base_tarif_augmentation (
  id BIGSERIAL PRIMARY KEY,
  client_code VARCHAR(64) NOT NULL,
  percent NUMERIC NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_base_tarif_aug_client ON base_tarif_augmentation (client_code);

-- ============================================================
-- 7. HISTORICAL & FEATURE DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS tour_leg_km_samples (
  id BIGSERIAL PRIMARY KEY,
  sitcode VARCHAR(64) NOT NULL,
  client_code VARCHAR(64) NOT NULL,
  tms_form_id VARCHAR(255) NOT NULL,
  distance_km DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_tour_leg_km_sample_trip UNIQUE (sitcode, client_code, tms_form_id)
);

CREATE INDEX IF NOT EXISTS ix_tour_leg_km_pair ON tour_leg_km_samples (sitcode, client_code);

CREATE TABLE IF NOT EXISTS anomaly_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NULL,
  severity VARCHAR(32) NOT NULL DEFAULT 'INFO',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
