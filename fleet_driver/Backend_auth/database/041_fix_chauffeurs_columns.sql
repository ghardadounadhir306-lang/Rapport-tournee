-- ============================================================
-- MIGRATION 041: Ensure all chauffeurs columns exist
-- Run this in pgAdmin to fix missing columns
-- ============================================================

-- Add employee_id column
ALTER TABLE chauffeurs
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(64);

-- Populate employee_id from id if NULL
UPDATE chauffeurs
SET employee_id = 'DRV-' || LPAD(id::text, 5, '0')
WHERE employee_id IS NULL;

-- Add camion column
ALTER TABLE chauffeurs
  ADD COLUMN IF NOT EXISTS camion VARCHAR(64);

-- Add role column
ALTER TABLE chauffeurs
  ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'driver';

-- Add timestamps
ALTER TABLE chauffeurs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE chauffeurs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Create indexes (ignore if they exist)
CREATE UNIQUE INDEX IF NOT EXISTS ux_chauffeurs_employee_id ON chauffeurs (employee_id);
CREATE INDEX IF NOT EXISTS ix_chauffeurs_camion ON chauffeurs (camion);
CREATE INDEX IF NOT EXISTS ix_chauffeurs_role ON chauffeurs (role);

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chauffeurs'
ORDER BY ordinal_position;
