-- ============================================================
-- MIGRATION 043: Ensure all trip-detail columns exist on
--                transport_data for mobile ↔ web integration
-- ============================================================
-- Run this ONCE in pgAdmin / psql before restarting backends.

-- voyhrf (H.Retour) — may already exist
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS voyhrf TIME;

-- arrivee_client / depart_client (client times)
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS arrivee_client TIME;

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS depart_client TIME;

-- km columns
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS km_arv_client VARCHAR(64);

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS km_dernier_client VARCHAR(64);

-- states column (pending / active / done)
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS states VARCHAR(64);

-- chargement (marchandise) — should already exist, safety net
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS chargement VARCHAR(255);

-- Back-populate km_dernier_client from otskm2 where missing
UPDATE transport_data
SET km_dernier_client = otskm2::text
WHERE km_dernier_client IS NULL
  AND otskm2 IS NOT NULL;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transport_data'
  AND column_name IN (
    'voyhrf', 'arrivee_client', 'depart_client',
    'km_arv_client', 'km_dernier_client', 'states', 'chargement'
  )
ORDER BY ordinal_position;
