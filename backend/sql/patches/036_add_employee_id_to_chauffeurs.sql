-- ============================================================
-- PATCH 036: Restore employee_id on chauffeurs
-- ============================================================

BEGIN;

ALTER TABLE chauffeurs
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(64);

UPDATE chauffeurs
SET employee_id = 'DRV-' || LPAD(id::text, 5, '0')
WHERE employee_id IS NULL OR TRIM(employee_id) = '';

ALTER TABLE chauffeurs
  ALTER COLUMN employee_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_chauffeurs_employee_id ON chauffeurs (employee_id);

COMMIT;