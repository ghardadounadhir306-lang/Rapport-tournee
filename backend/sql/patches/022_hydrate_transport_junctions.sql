-- ============================================================
-- 022_hydrate_transport_junctions.sql
-- Migrates the connections between transport_data and the new 
-- depots and poi_clients tables based on the string codes.
--
-- Note: Check if "sitcode", "otdcode", and "tiecode" correctly
-- match the logic for your business.
-- ============================================================

-- 1. Link Depots to Transports
-- Here we assume "sitcode" (Site Code) matches the depot "code"
INSERT INTO transport_depots (transport_id, depot_id)
SELECT t.id, d.id
FROM transport_data t
JOIN depots d ON t.sitcode = d.code
ON CONFLICT (transport_id, depot_id) DO NOTHING;

-- (Optional) If "otdcode" also represents a depot:
INSERT INTO transport_depots (transport_id, depot_id)
SELECT t.id, d.id
FROM transport_data t
JOIN depots d ON t.otdcode = d.code
ON CONFLICT (transport_id, depot_id) DO NOTHING;


-- 2. Link Clients/Magasins to Transports
-- Primary mapping: "otdcode" (destination/client code) -> poi_clients.code
INSERT INTO transport_poi_clients (transport_id, poi_client_id)
SELECT t.id, p.id
FROM transport_data t
JOIN poi_clients p ON t.otdcode = p.code
ON CONFLICT (transport_id, poi_client_id) DO NOTHING;

-- Optional fallback if tiecode also matches poi_clients.code
INSERT INTO transport_poi_clients (transport_id, poi_client_id)
SELECT t.id, p.id
FROM transport_data t
JOIN poi_clients p ON t.tiecode = p.code
ON CONFLICT (transport_id, poi_client_id) DO NOTHING;

-- ============================================================
-- Once you have validated all data across:
-- - depots
-- - poi_clients
-- - transport_depots
-- - transport_poi_clients
-- You can safely execute the drop command:
-- DROP TABLE IF EXISTS client_pois CASCADE;
-- ============================================================
