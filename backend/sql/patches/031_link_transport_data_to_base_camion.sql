-- ============================================================
-- PATCH 031: Link transport_data to base_camion
-- Adds a real camion foreign key while keeping PLAMOTI as source label
-- ============================================================

BEGIN;

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS camion_code VARCHAR(128) NULL;

CREATE INDEX IF NOT EXISTS ix_transport_data_camion_code
  ON transport_data (camion_code);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_transport_data_camion_code'
  ) THEN
    ALTER TABLE transport_data
      ADD CONSTRAINT fk_transport_data_camion_code
      FOREIGN KEY (camion_code)
      REFERENCES base_camion (camion)
      ON DELETE SET NULL;
  END IF;
END $$;

UPDATE transport_data td
SET camion_code = td.plamoti
FROM base_camion bc
WHERE td.camion_code IS NULL
  AND td.plamoti = bc.camion;

COMMIT;