-- ============================================================
-- PATCH 034: Add auth fields + relation to base_camion
-- ============================================================

BEGIN;

ALTER TABLE chauffeurs
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(64),
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS camion VARCHAR(64),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

UPDATE chauffeurs
SET employee_id = 'DRV-' || LPAD(id::text, 5, '0')
WHERE employee_id IS NULL;

UPDATE chauffeurs
SET password_hash = '$2b$10$3QxGUYlyhQ8x7x8cJ7M3k.WvVDYxjJx7ynqQWiwxupCSvJ0puG1HS'
WHERE password_hash IS NULL;

ALTER TABLE chauffeurs
  ALTER COLUMN employee_id SET NOT NULL,
  ALTER COLUMN password_hash SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_chauffeurs_camion'
  ) THEN
    ALTER TABLE chauffeurs
      ADD CONSTRAINT fk_chauffeurs_camion
      FOREIGN KEY (camion)
      REFERENCES base_camion(camion)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_chauffeurs_employee_id ON chauffeurs (employee_id);
CREATE INDEX IF NOT EXISTS ix_chauffeurs_camion ON chauffeurs (camion);

COMMIT;
