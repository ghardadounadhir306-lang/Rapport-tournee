-- ============================================================
-- 021_create_transport_data.sql
-- Recreate transport_data and junction tables (Option B) with cascade safety.
-- Drop existing objects if they already exist to avoid FK column errors.
DROP TABLE IF EXISTS transport_depots CASCADE;
DROP TABLE IF EXISTS transport_poi_clients CASCADE;
DROP TABLE IF EXISTS transport_data CASCADE;

-- ============================================================
-- 1. Main transport_data table
CREATE TABLE IF NOT EXISTS transport_data (
    id SERIAL PRIMARY KEY,
    "affcode" TEXT,
    "artcode" TEXT,
    "cdate" TIMESTAMP,
    "entnbpal" INTEGER,
    "otdcode" TEXT,
    "otscontainer" TEXT,
    "otsetat" TEXT,
    "states" TEXT NOT NULL DEFAULT 'pending' CHECK ("states" IN ('pending', 'done')),
    "otskm2" NUMERIC,
    "otsnumbdx" INTEGER,
    "ottmt" TEXT,
    "placha1i" TEXT,
    "plakm1" NUMERIC,
    "plakm2" NUMERIC,
    "plalib" TEXT,
    "plamoti" TEXT,
    "plargiarr" TEXT,
    "rgilibl" TEXT,
    "salnom" TEXT,
    "saltel" TEXT,
    "sitcode" TEXT,
    "sitsiretedi" TEXT,
    "tiecode" TEXT,
    "toucode" TEXT,
    "voycle" TEXT,
    "voydtd" DATE,
    "voyhrd" TIME,
    "voypal" INTEGER,
    "performance_camion" NUMERIC,
    "performance_chauffeur" NUMERIC,
    "taux_remplissage_pal" NUMERIC,
    "taux_remplissage_ton" NUMERIC,
    "mdate" TIMESTAMP,
    "sitechauff" TEXT,
    "sitecamion" TEXT,
    "salmemoe" TEXT,
    "otsnum" TEXT,
    "platouordre" TEXT,
    "salmobilite" TEXT,
    "km_tsp" NUMERIC,
    "toutrafcode" TEXT,
    "chargement" TEXT,
    "voydtf" DATE,
    "otdhd" TEXT,
    voymemo TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Junction table linking transports to depots
CREATE TABLE IF NOT EXISTS transport_depots (
    transport_id INTEGER NOT NULL REFERENCES transport_data(id) ON DELETE CASCADE ON UPDATE CASCADE,
    depot_id BIGINT NOT NULL REFERENCES depots(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (transport_id, depot_id)
);

-- 3. Junction table linking transports to poi_clients
CREATE TABLE IF NOT EXISTS transport_poi_clients (
    transport_id INTEGER NOT NULL REFERENCES transport_data(id) ON DELETE CASCADE ON UPDATE CASCADE,
    poi_client_id BIGINT NOT NULL REFERENCES poi_clients(id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (transport_id, poi_client_id)
);

-- Indexes for fast look‑ups
CREATE INDEX IF NOT EXISTS ix_transport_depots_transport ON transport_depots (transport_id);
CREATE INDEX IF NOT EXISTS ix_transport_depots_depot ON transport_depots (depot_id);
CREATE INDEX IF NOT EXISTS ix_transport_poi_clients_transport ON transport_poi_clients (transport_id);
CREATE INDEX IF NOT EXISTS ix_transport_poi_clients_client ON transport_poi_clients (poi_client_id);
