-- ============================================================
-- MIGRATION 039: Link driver_trips to transport_data
-- ============================================================

BEGIN;

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS voyhrf TIME;

ALTER TABLE driver_trips
  ADD COLUMN IF NOT EXISTS transport_data_id BIGINT;

CREATE INDEX IF NOT EXISTS ix_driver_trips_transport_data_id
  ON driver_trips (transport_data_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_driver_trips_transport_data'
      AND table_name = 'driver_trips'
  ) THEN
    ALTER TABLE driver_trips
      ADD CONSTRAINT fk_driver_trips_transport_data
      FOREIGN KEY (transport_data_id)
      REFERENCES transport_data(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

UPDATE driver_trips dt
SET transport_data_id = (
  SELECT td.id
  FROM transport_data td
  WHERE td.sal_id = dt.chauffeur_id::bigint
    AND td.sitcode = dt.origin
    AND td.otdcode = dt.destination
  ORDER BY td."createdAt" DESC NULLS LAST, td.id DESC
  LIMIT 1
)
WHERE dt.transport_data_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM transport_data td
    WHERE td.sal_id = dt.chauffeur_id::bigint
      AND td.sitcode = dt.origin
      AND td.otdcode = dt.destination
  );

COMMIT;