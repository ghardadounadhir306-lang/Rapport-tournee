-- Incremental patch: add OTSNUMBDX column for WMS/TMS mapping

SET NAMES utf8mb4;

USE r_tournee;

ALTER TABLE tms_import_rows
  ADD COLUMN otsnumbdx VARCHAR(128) NULL AFTER otskm2;
