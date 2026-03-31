-- Incremental patch: create form table for TMS UI (tournee form + table rows)
-- Safe to run multiple times.
--
-- This table is used by:
-- - GET  /api/tms/form-data/:id
-- - POST /api/tms/form-data/:id

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS r_tournee
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE r_tournee;

CREATE TABLE IF NOT EXISTS tms_form_data (
  id VARCHAR(255) NOT NULL,
  tms_id VARCHAR(255) NULL,

  date VARCHAR(255) NULL,
  wms VARCHAR(255) NULL,
  prestation VARCHAR(255) NULL,
  truck VARCHAR(255) NULL,
  driver VARCHAR(255) NULL,
  dep VARCHAR(255) NULL,

  km_facture VARCHAR(255) NULL,
  marchandise VARCHAR(255) NULL,
  conformite VARCHAR(255) NULL,
  observation TEXT NULL,

  h_depart VARCHAR(255) NULL,
  km_depart VARCHAR(255) NULL,
  h_retour VARCHAR(255) NULL,
  km_retour VARCHAR(255) NULL,
  km_dernier_client VARCHAR(255) NULL,
  km_moy VARCHAR(255) NULL,

  total_palettes VARCHAR(255) NULL,
  total_palettes_2 VARCHAR(255) NULL,
  tournee_sec VARCHAR(255) NULL,

  apres_midi TINYINT(1) NOT NULL DEFAULT 0,
  inter_site TINYINT(1) NOT NULL DEFAULT 0,

  gps_start_lat DECIMAL(10,7) NULL,
  gps_start_lng DECIMAL(10,7) NULL,
  gps_end_lat DECIMAL(10,7) NULL,
  gps_end_lng DECIMAL(10,7) NULL,

  table_rows JSON NULL,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY ix_tms_form_data_tms_id (tms_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

