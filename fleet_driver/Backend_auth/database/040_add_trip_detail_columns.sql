-- ============================================================
-- MIGRATION 040: Add trip detail columns to transport_data
-- ============================================================

-- 1. Add columns
ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS arrivee_client TIME;

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS depart_client TIME;

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS km_arv_client VARCHAR(64);

ALTER TABLE transport_data
  ADD COLUMN IF NOT EXISTS km_dernier_client VARCHAR(64);

-- 2. Back-populate km_dernier_client from otskm2 (cast to text for safety)
UPDATE transport_data
SET km_dernier_client = otskm2::text
WHERE km_dernier_client IS NULL
  AND otskm2 IS NOT NULL;

-- 3. Verify
SELECT
  COUNT(*) AS total,
  COUNT(arrivee_client) AS has_arrivee_client,
  COUNT(depart_client) AS has_depart_client,
  COUNT(km_arv_client) AS has_km_arv_client,
  COUNT(km_dernier_client) AS has_km_dernier_client
FROM transport_data;
