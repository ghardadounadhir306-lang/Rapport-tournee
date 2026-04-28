-- ============================================================
-- MIGRATION 042: Add ALL missing columns to transport_data
-- Run this in pgAdmin ONCE to fix everything
-- ============================================================

-- voyhrf column (H.retour - was supposed to be added by migration 039)
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS voyhrf TIME;

-- Trip detail columns
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS arrivee_client TIME;

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS depart_client TIME;

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS km_arv_client VARCHAR(64);

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS km_dernier_client VARCHAR(64);

-- states column
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS states VARCHAR(64);

-- Back-populate km_dernier_client from otskm2
UPDATE transport_data
SET km_dernier_client = otskm2::text
WHERE km_dernier_client IS NULL
  AND otskm2 IS NOT NULL;

-- Verify all columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transport_data'
ORDER BY ordinal_position;
