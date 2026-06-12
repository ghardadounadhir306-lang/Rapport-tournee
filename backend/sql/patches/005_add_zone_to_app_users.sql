-- ============================================================
-- Patch 005 : Ajouter la colonne zone à app_users
-- Permet de restreindre chaque utilisateur à son dépôt (zone)
-- Exécuter une seule fois sur la base Rtournee (PostgreSQL)
-- ============================================================

ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS zone VARCHAR(64) DEFAULT NULL;

COMMENT ON COLUMN app_users.zone IS
  'Code dépôt de l''utilisateur (ex: BAR, TUN). NULL = aucune restriction (admin voit tout). Doit correspondre au champ sitcode dans transport_data.';
