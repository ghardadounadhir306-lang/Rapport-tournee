-- Incremental patch: create staging table for TMS Excel imports
-- Safe to run multiple times.

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS r_tournee
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE r_tournee;

CREATE TABLE IF NOT EXISTS tms_import_rows (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  affcode VARCHAR(64) NULL,
  artcode VARCHAR(64) NULL,
  cdate DATE NULL,
  entnbpal INT NULL,
  otdcode VARCHAR(64) NULL,
  otscontainer VARCHAR(64) NULL,
  otsetat VARCHAR(64) NULL,
  otskm2 DECIMAL(10,2) NULL,
  otsnumbdx VARCHAR(128) NULL,
  ottmt DECIMAL(12,2) NULL,
  placha1i VARCHAR(64) NULL,
  plakm1 DECIMAL(10,2) NULL,
  plakm2 DECIMAL(10,2) NULL,
  plalib VARCHAR(255) NULL,
  plamoti VARCHAR(255) NULL,
  plargiarr VARCHAR(255) NULL,
  rgilibl VARCHAR(255) NULL,
  salnom VARCHAR(255) NULL,
  saltel VARCHAR(64) NULL,
  sitcode VARCHAR(64) NULL,
  sitsiretedi VARCHAR(32) NULL,
  tiecode VARCHAR(64) NULL,
  toucode VARCHAR(64) NULL,
  voycle VARCHAR(128) NULL,
  voydtd DATETIME(3) NULL,
  voyhrd VARCHAR(32) NULL,
  voypal INT NULL,
  performance_camion DECIMAL(10,4) NULL,
  performance_chauffeur DECIMAL(10,4) NULL,
  taux_remplissage_pal DECIMAL(6,2) NULL,
  taux_remplissage_ton DECIMAL(6,2) NULL,
  mdate DATETIME(3) NULL,
  sitechauff VARCHAR(64) NULL,
  sitecamion VARCHAR(64) NULL,
  salmemoe TEXT NULL,
  otsnum VARCHAR(128) NULL,
  platouordre INT NULL,
  salmobilite VARCHAR(64) NULL,
  km_tsp DECIMAL(10,2) NULL,
  toutrafcode VARCHAR(64) NULL,
  chargement VARCHAR(255) NULL,
  voydtf DATETIME(3) NULL,
  otdhd DATETIME(3) NULL,
  voymemo TEXT NULL,

  raw_json LONGTEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (id),
  KEY ix_tms_import_otsnum (otsnum),
  KEY ix_tms_import_toucode (toucode),
  KEY ix_tms_import_cdate (cdate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
