-- Fix TMS import staging: ottmt is string (e.g. 0+0+0+0), not decimal; add VOYHRF from exports.
-- Safe to run once; re-run MODIFY is idempotent.

SET NAMES utf8mb4;

USE r_tournee;

-- ottmt: Excel exports use concatenated strings, not numbers
ALTER TABLE tms_import_rows
  MODIFY COLUMN ottmt VARCHAR(64) NULL;

-- voyhrf: end time (HHMM) — was missing from initial schema
-- If you already added voyhrf, skip this line (duplicate column error).
ALTER TABLE tms_import_rows
  ADD COLUMN voyhrf VARCHAR(32) NULL AFTER voyhrd;
