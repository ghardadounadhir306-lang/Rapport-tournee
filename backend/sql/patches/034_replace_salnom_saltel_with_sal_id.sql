-- ============================================================
-- PATCH 034: Replace salnom/saltel with sal_id in transport_data
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS chauffeurs (
  id BIGSERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  cin VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  tel VARCHAR(64) NULL
);

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS sal_id BIGINT NULL;

CREATE INDEX IF NOT EXISTS ix_transport_data_sal_id
  ON transport_data (sal_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transport_data'
      AND column_name = 'salnom'
  ) THEN
    UPDATE transport_data td
    SET sal_id = c.id
    FROM chauffeurs c
    WHERE td.sal_id IS NULL
      AND LOWER(TRIM(td.salnom)) = LOWER(TRIM(c.prenom || ' ' || c.nom))
      AND (
        NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'transport_data'
            AND column_name = 'saltel'
        )
        OR td.saltel IS NULL
        OR TRIM(td.saltel) = ''
        OR c.tel IS NULL
        OR TRIM(c.tel) = ''
        OR TRIM(td.saltel) = TRIM(c.tel)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'chauffeurs'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_transport_data_sal_id'
  ) THEN
    ALTER TABLE transport_data
      ADD CONSTRAINT fk_transport_data_sal_id
      FOREIGN KEY (sal_id)
      REFERENCES chauffeurs (id)
      ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE transport_data DROP COLUMN IF EXISTS salnom;
ALTER TABLE transport_data DROP COLUMN IF EXISTS saltel;

COMMIT;