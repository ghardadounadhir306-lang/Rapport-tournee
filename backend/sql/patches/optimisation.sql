-- ============================================================================
-- OPTIMISATION : Vue d'analyse des écarts KM et Temps
-- Base: PostgreSQL
-- Dépendance: table tms_form_data (déjà existante)
-- ============================================================================

-- Vue calculée : analyse de conformité KM et Temps par tournée
-- Utilise les données de tms_form_data + JSON table_rows pour KM théorique
CREATE OR REPLACE VIEW v_tournee_optimisation AS
SELECT
  fd.id,
  fd.tms_id,
  fd.date,
  fd.wms,
  fd.truck,
  fd.driver,
  fd.prestation,
  fd.site_id,
  fd.km_facture,
  fd.km_depart,
  fd.km_retour,
  fd.km_dernier_client,
  fd.h_depart,
  fd.h_retour,
  fd.conformite,
  fd.created_at,
  fd.updated_at,

  -- ── KM réel (km facturé, ou km_dernier_client − km_depart) ──
  CASE
    WHEN fd.km_facture IS NOT NULL AND TRIM(fd.km_facture) != ''
         AND REPLACE(fd.km_facture, ',', '.')::NUMERIC > 0
    THEN ROUND(REPLACE(fd.km_facture, ',', '.')::NUMERIC, 2)
    WHEN fd.km_dernier_client IS NOT NULL AND fd.km_depart IS NOT NULL
         AND TRIM(fd.km_dernier_client) != '' AND TRIM(fd.km_depart) != ''
         AND REPLACE(fd.km_dernier_client, ',', '.')::NUMERIC > REPLACE(fd.km_depart, ',', '.')::NUMERIC
    THEN ROUND(REPLACE(fd.km_dernier_client, ',', '.')::NUMERIC
             - REPLACE(fd.km_depart, ',', '.')::NUMERIC, 2)
    ELSE NULL
  END AS km_reel,

  -- ── KM théorique (somme des kmTh du JSON table_rows) ──
  COALESCE((
    SELECT SUM(
      CASE
        WHEN elem->>'kmTh' IS NOT NULL AND TRIM(elem->>'kmTh') != ''
        THEN REPLACE(elem->>'kmTh', ',', '.')::NUMERIC
        ELSE 0
      END
    )
    FROM json_array_elements(
      CASE
        WHEN fd.table_rows IS NOT NULL AND fd.table_rows::text != 'null'
        THEN fd.table_rows
        ELSE '[]'::json
      END
    ) AS elem
  ), 0) AS km_theorique,

  -- ── Nombre de clients (lignes table_rows avec un code client) ──
  COALESCE((
    SELECT COUNT(*)
    FROM json_array_elements(
      CASE
        WHEN fd.table_rows IS NOT NULL AND fd.table_rows::text != 'null'
        THEN fd.table_rows
        ELSE '[]'::json
      END
    ) AS elem
    WHERE elem->>'client' IS NOT NULL AND TRIM(elem->>'client') != ''
  ), 0)::INT AS nb_clients,

  -- ── Durée réelle en minutes (h_retour − h_depart) ──
  CASE
    WHEN fd.h_depart IS NOT NULL AND fd.h_retour IS NOT NULL
         AND TRIM(fd.h_depart) != '' AND TRIM(fd.h_retour) != ''
         AND fd.h_depart ~ '^\d{1,2}:\d{2}'
         AND fd.h_retour ~ '^\d{1,2}:\d{2}'
    THEN ROUND(EXTRACT(EPOCH FROM (fd.h_retour::time - fd.h_depart::time)) / 60)
    ELSE NULL
  END AS duree_reelle_min,

  -- ── Détail clients (JSON) ──
  fd.table_rows

FROM tms_form_data fd
ORDER BY fd.updated_at DESC NULLS LAST;

-- ============================================================================
-- Optionnel : Index pour accélérer les requêtes
-- ============================================================================
-- CREATE INDEX IF NOT EXISTS idx_tms_form_data_updated ON tms_form_data(updated_at DESC);
