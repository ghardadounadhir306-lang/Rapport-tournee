-- ============================================================
-- MIGRATION 038: Add role column to chauffeurs
-- ============================================================

BEGIN;

ALTER TABLE chauffeurs
  ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'driver';

-- Create a super_admin account for permissions management
UPDATE chauffeurs
SET role = 'super_admin'
WHERE employee_id = 'DRV-00001';

CREATE INDEX IF NOT EXISTS ix_chauffeurs_role ON chauffeurs (role);

COMMIT;
