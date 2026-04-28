-- ============================================================
-- PATCH 032: Create base_chauffeur master table
-- Standalone schema patch for pgAdmin / repeatable setup
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS base_chauffeur (
  id BIGSERIAL PRIMARY KEY,
  chauffeur VARCHAR(255) NOT NULL,
  telephone VARCHAR(64) NULL,
  site VARCHAR(128) NULL,
  affectation VARCHAR(255) NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_base_chauffeur_chauffeur ON base_chauffeur (chauffeur);
CREATE INDEX IF NOT EXISTS ix_base_chauffeur_site ON base_chauffeur (site);
CREATE INDEX IF NOT EXISTS ix_base_chauffeur_telephone ON base_chauffeur (telephone);

COMMIT;