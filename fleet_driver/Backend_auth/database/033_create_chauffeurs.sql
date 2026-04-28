-- ============================================================
-- PATCH 033: Create chauffeurs table
-- Requested columns: id, nom, prenom, cin, email, tel
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

CREATE INDEX IF NOT EXISTS ix_chauffeurs_nom ON chauffeurs (nom);
CREATE INDEX IF NOT EXISTS ix_chauffeurs_prenom ON chauffeurs (prenom);
CREATE INDEX IF NOT EXISTS ix_chauffeurs_tel ON chauffeurs (tel);

COMMIT;