-- MySQL schema for R.tournee (best-effort from provided class diagram)
-- Engine: InnoDB, Charset: utf8mb4
-- Note: If any enum values/columns differ from your diagram, adjust accordingly.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create and select the database
CREATE DATABASE IF NOT EXISTS r_tournee
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE r_tournee;

DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS anomaly_comments;
DROP TABLE IF EXISTS anomalies;
DROP TABLE IF EXISTS conformite_checks;
DROP TABLE IF EXISTS tms_import_rows;
DROP TABLE IF EXISTS paiements;
DROP TABLE IF EXISTS facture_lignes;
DROP TABLE IF EXISTS factures;
DROP TABLE IF EXISTS tournee_reports;
DROP TABLE IF EXISTS gps_points;
DROP TABLE IF EXISTS commandes;
DROP TABLE IF EXISTS tournees;
DROP TABLE IF EXISTS tarifs;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS zones;

-- ===== Enums (implemented as MySQL ENUM columns in tables) =====
-- InvoiceStatus: BROUILLON, EN_COURS, VALIDE, ENVOYE, PAYE_PARTIEL, PAYE, ANNULEE
-- TourReportStatus: BROUILLON, VALIDE
-- PaymentStatus: EN_ATTENTE, PARTIEL, PAYE, EN_RETARD
-- AnomalyStatus: OUVERT, EN_COURS, RESOLU, REJETE, REDUITE
-- Severity: INFO, ALERTE, BLOQUANT
-- Category: DISTANCE, TEMPS, ZONE, DEPART, GPS, SUPPLYCHAIN, AUTRE
-- CommandeStatus: PREVUE, EN_COURS, TERMINEE, ANNULEE
-- TourneeStatus: PREVUE, EN_COURS, TERMINEE
-- CheckResult: OK, ALERTE, BLOQUANT
-- CheckType: CLIENT, STATUT_COMMANDE, ZONE, ECART_KM, ECART_TEMPS, GPS_QUALITE, KILOMETRIQUE, RESPONSABLE, PIECE_JOINTE_MANQUANTE, JUSTIFICATION_MANQUANTE

CREATE TABLE zones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_zones_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clients (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entreprise VARCHAR(255) NOT NULL,
  contact VARCHAR(255) NULL,
  email VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_clients_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== Staging table for Excel imports (keeps columns as-is) =====
CREATE TABLE tms_import_rows (
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

CREATE TABLE tarifs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  zone_id BIGINT UNSIGNED NOT NULL,
  tarif_horaire DECIMAL(10,2) NOT NULL,
  tarif_km DECIMAL(10,2) NOT NULL,
  date_debut DATE NOT NULL,
  date_fin DATE NULL,
  actif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_tarifs_zone (zone_id),
  CONSTRAINT fk_tarifs_zone FOREIGN KEY (zone_id) REFERENCES zones(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tournees (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  zone_id BIGINT UNSIGNED NULL,
  tarif_id BIGINT UNSIGNED NULL,
  vehicule VARCHAR(128) NULL,
  status ENUM('PREVUE','EN_COURS','TERMINEE') NOT NULL DEFAULT 'PREVUE',
  planned_start_at DATETIME(3) NULL,
  actual_start_at DATETIME(3) NULL,
  planned_end_at DATETIME(3) NULL,
  actual_end_at DATETIME(3) NULL,
  km_estime DECIMAL(10,2) NULL,
  km_parcouru DECIMAL(10,2) NULL,
  duree_estimee_min INT NULL,
  duree_reelle_min INT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_tournees_zone (zone_id),
  KEY ix_tournees_tarif (tarif_id),
  CONSTRAINT fk_tournees_zone FOREIGN KEY (zone_id) REFERENCES zones(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_tournees_tarif FOREIGN KEY (tarif_id) REFERENCES tarifs(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE commandes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ref VARCHAR(128) NOT NULL,
  client_id BIGINT UNSIGNED NOT NULL,
  tournee_id BIGINT UNSIGNED NULL,
  status ENUM('PREVUE','EN_COURS','TERMINEE','ANNULEE') NOT NULL DEFAULT 'PREVUE',
  adresse TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_commandes_ref (ref),
  KEY ix_commandes_client (client_id),
  KEY ix_commandes_tournee (tournee_id),
  CONSTRAINT fk_commandes_client FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_commandes_tournee FOREIGN KEY (tournee_id) REFERENCES tournees(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gps_points (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tournee_id BIGINT UNSIGNED NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  altitude_m FLOAT NULL,
  speed_mps FLOAT NULL,
  accuracy_m FLOAT NULL,
  recorded_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_gps_tournee_time (tournee_id, recorded_at),
  CONSTRAINT fk_gps_tournee FOREIGN KEY (tournee_id) REFERENCES tournees(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tournee_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tournee_id BIGINT UNSIGNED NOT NULL,
  status ENUM('BROUILLON','VALIDE') NOT NULL DEFAULT 'BROUILLON',
  report_content LONGTEXT NULL,
  -- "tarif applique (snapshot)"
  tarif_horaire_applique DECIMAL(10,2) NULL,
  tarif_km_applique DECIMAL(10,2) NULL,
  montant_total DECIMAL(10,2) NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_report_tournee (tournee_id),
  CONSTRAINT fk_report_tournee FOREIGN KEY (tournee_id) REFERENCES tournees(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE factures (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  report_tournee_id BIGINT UNSIGNED NULL,
  status ENUM('BROUILLON','EN_COURS','VALIDE','ENVOYE','PAYE_PARTIEL','PAYE','ANNULEE') NOT NULL DEFAULT 'BROUILLON',
  date_facture DATE NOT NULL,
  total_ht DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_tva DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_ttc DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  created_by_user_id BIGINT UNSIGNED NULL,
  issued_by_user_id BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY ix_factures_client (client_id),
  KEY ix_factures_report (report_tournee_id),
  CONSTRAINT fk_factures_client FOREIGN KEY (client_id) REFERENCES clients(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_factures_report FOREIGN KEY (report_tournee_id) REFERENCES tournee_reports(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE facture_lignes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  facture_id BIGINT UNSIGNED NOT NULL,
  libelle VARCHAR(255) NOT NULL,
  quantite INT NOT NULL DEFAULT 1,
  prix_unitaire DECIMAL(12,2) NOT NULL DEFAULT 0,
  taux_tva DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_ligne DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_lignes_facture (facture_id),
  CONSTRAINT fk_lignes_facture FOREIGN KEY (facture_id) REFERENCES factures(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE paiements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  facture_id BIGINT UNSIGNED NOT NULL,
  status ENUM('EN_ATTENTE','PARTIEL','PAYE','EN_RETARD') NOT NULL DEFAULT 'EN_ATTENTE',
  reference VARCHAR(255) NULL,
  montant DECIMAL(12,2) NOT NULL,
  date_paiement DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_paiements_facture (facture_id),
  CONSTRAINT fk_paiements_facture FOREIGN KEY (facture_id) REFERENCES factures(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE conformite_checks (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  commande_id BIGINT UNSIGNED NOT NULL,
  type ENUM(
    'CLIENT',
    'STATUT_COMMANDE',
    'ZONE',
    'ECART_KM',
    'ECART_TEMPS',
    'GPS_QUALITE',
    'KILOMETRIQUE',
    'RESPONSABLE',
    'PIECE_JOINTE_MANQUANTE',
    'JUSTIFICATION_MANQUANTE'
  ) NOT NULL,
  result ENUM('OK','ALERTE','BLOQUANT') NOT NULL,
  comment TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_checks_commande (commande_id),
  CONSTRAINT fk_checks_commande FOREIGN KEY (commande_id) REFERENCES commandes(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE anomalies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  commande_id BIGINT UNSIGNED NOT NULL,
  severity ENUM('INFO','ALERTE','BLOQUANT') NOT NULL,
  category ENUM('DISTANCE','TEMPS','ZONE','DEPART','GPS','SUPPLYCHAIN','AUTRE') NOT NULL,
  status ENUM('OUVERT','EN_COURS','RESOLU','REJETE','REDUITE') NOT NULL DEFAULT 'OUVERT',
  description TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_anomalies_commande (commande_id),
  KEY ix_anomalies_status (status),
  CONSTRAINT fk_anomalies_commande FOREIGN KEY (commande_id) REFERENCES commandes(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE anomaly_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  anomalie_id BIGINT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_comments_anomalie (anomalie_id),
  CONSTRAINT fk_comments_anomalie FOREIGN KEY (anomalie_id) REFERENCES anomalies(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  anomalie_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  url_or_path TEXT NOT NULL,
  uploaded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_attachments_anomalie (anomalie_id),
  CONSTRAINT fk_attachments_anomalie FOREIGN KEY (anomalie_id) REFERENCES anomalies(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
