-- GPS: link points to TMS forms; optional tournee_id; form GPS snapshot columns.
-- Apply after base schema. Safe to re-run if your DB already has these columns (may error — ignore or use IF NOT EXISTS per column via procedure).

USE r_tournee;

-- gps_points: allow TMS form id without a tournees row
ALTER TABLE gps_points DROP FOREIGN KEY fk_gps_tournee;
ALTER TABLE gps_points MODIFY tournee_id BIGINT UNSIGNED NULL;
ALTER TABLE gps_points ADD COLUMN tms_form_id VARCHAR(255) NULL AFTER tournee_id;
ALTER TABLE gps_points ADD KEY ix_gps_tms_form_time (tms_form_id, recorded_at);
ALTER TABLE gps_points ADD CONSTRAINT fk_gps_tournee FOREIGN KEY (tournee_id) REFERENCES tournees(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- tms_form_data: départ / arrivée GPS (saisie carte)
ALTER TABLE tms_form_data ADD COLUMN gps_start_lat DECIMAL(10,7) NULL;
ALTER TABLE tms_form_data ADD COLUMN gps_start_lng DECIMAL(10,7) NULL;
ALTER TABLE tms_form_data ADD COLUMN gps_end_lat DECIMAL(10,7) NULL;
ALTER TABLE tms_form_data ADD COLUMN gps_end_lng DECIMAL(10,7) NULL;
