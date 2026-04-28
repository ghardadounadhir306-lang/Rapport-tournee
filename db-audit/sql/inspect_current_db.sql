-- Live database inspection for schema rebuild
-- Run this against the active database, not the patch files.

select version() as pg_version;
select current_database() as current_database;
select current_schema() as current_schema;

select
  table_name
from information_schema.tables
where table_schema = current_schema()
order by table_name;

select
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = current_schema()
order by table_name, ordinal_position;

select
  tc.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = current_schema()
order by tc.table_name, tc.constraint_name;

select
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = current_schema()
order by tablename, indexname;

select 'transport_data' as table_name, count(*)::bigint as row_count from transport_data
union all
select 'tms_form_data', count(*)::bigint from tms_form_data
union all
select 'tms_import_rows', count(*)::bigint from tms_import_rows
union all
select 'depots', count(*)::bigint from depots
union all
select 'poi_clients', count(*)::bigint from poi_clients
union all
select 'anomaly_types', count(*)::bigint from anomaly_types
union all
select 'anomalies', count(*)::bigint from anomalies
union all
select 'activity_logs', count(*)::bigint from activity_logs
union all
select 'base_camion', count(*)::bigint from base_camion
union all
select 'base_tarif', count(*)::bigint from base_tarif
union all
select 'base_tarif_effective_date', count(*)::bigint from base_tarif_effective_date
union all
select 'base_tarif_augmentation', count(*)::bigint from base_tarif_augmentation
union all
select 'tour_leg_km_samples', count(*)::bigint from tour_leg_km_samples
union all
select 'transport_depots', count(*)::bigint from transport_depots
union all
select 'transport_poi_clients', count(*)::bigint from transport_poi_clients
union all
select 'transport_sites', count(*)::bigint from transport_sites
union all
select 'app_users', count(*)::bigint from app_users
order by table_name;

select * from transport_data limit 5;
select * from tms_form_data limit 5;
select * from tms_import_rows limit 5;
select * from depots limit 5;
select * from poi_clients limit 5;
select * from anomaly_types limit 10;
select * from anomalies limit 5;
select * from activity_logs limit 5;
select * from base_camion limit 5;
select * from base_tarif limit 5;
select * from base_tarif_effective_date limit 5;
select * from base_tarif_augmentation limit 5;
select * from tour_leg_km_samples limit 5;
select * from transport_depots limit 5;
select * from transport_poi_clients limit 5;
select * from transport_sites limit 5;
select * from app_users limit 5;
