-- ============================================================
-- PATCH 035: Drop deprecated base_chauffeur table
-- Keep chauffeurs as the single source of truth
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS base_chauffeur CASCADE;

COMMIT;