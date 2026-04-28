-- ============================================================
-- MIGRATION 037: Create transport_data table + Import CSV
-- CSV Path: C:\Users\USER\fleet_driver\Backend_auth\database\data-1776345398572.csv
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Create transport_data table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transport_data (
  id                      BIGINT,
  cdate                   TIMESTAMP,
  entnbpal                INTEGER,
  otskm2                  VARCHAR(64),
  otsnumbdx               BIGINT,
  plakm1                  VARCHAR(64),
  plakm2                  VARCHAR(64),
  voydtd                  DATE,
  voyhrd                  TIME,
  voyhrf                  TIME,
  voypal                  INTEGER,
  performance_camion      VARCHAR(64),
  performance_chauffeur   VARCHAR(64),
  taux_remplissage_pal    VARCHAR(64),
  taux_remplissage_ton    VARCHAR(64),
  mdate                   TIMESTAMP,
  km_tsp                  VARCHAR(64),
  voydtf                  DATE,
  "createdAt"             TIMESTAMP,
  "updatedAt"             TIMESTAMP,
  affcode                 VARCHAR(64),
  artcode                 VARCHAR(64),
  otdcode                 VARCHAR(64),
  otscontainer            VARCHAR(128),
  otsetat                 VARCHAR(8),
  ottmt                   VARCHAR(64),
  placha1i                VARCHAR(64),
  plalib                  VARCHAR(255),
  plamoti                 VARCHAR(255),
  plargiarr               VARCHAR(8),
  rgilibl                 VARCHAR(128),
  sitcode                 VARCHAR(64),
  sitsiretedi             VARCHAR(64),
  tiecode                 VARCHAR(64),
  toucode                 VARCHAR(64),
  voycle                  VARCHAR(64),
  sitechauff              VARCHAR(64),
  sitecamion              VARCHAR(64),
  salmemoe                VARCHAR(64),
  otsnum                  VARCHAR(128),
  platouordre             VARCHAR(64),
  salmobilite             VARCHAR(16),
  toutrafcode             VARCHAR(64),
  chargement              VARCHAR(128),
  otdhd                   VARCHAR(64),
  voymemo                 VARCHAR(255),
  camion_code             VARCHAR(64),
  sal_id                  VARCHAR(64),
  states                  VARCHAR(64)
);

-- ────────────────────────────────────────────────────────────
-- 2. Import CSV (run this in pgAdmin Query Tool)
-- ────────────────────────────────────────────────────────────
-- NOTE:
-- Automated migration runner skips CSV import to avoid environment-specific failures.
-- If needed, run the COPY manually from pgAdmin after ensuring table schema matches.

-- ────────────────────────────────────────────────────────────
-- 3. Vérification rapide
-- ────────────────────────────────────────────────────────────
SELECT COUNT(*) AS total_imported FROM transport_data;
