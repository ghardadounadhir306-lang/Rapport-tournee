# Transport Rebuild Summary (Live DB)

## Rebuild status
- Source file used: db-audit/csv/ExcelFile_2026-03-13T10_19_12.xlsx - Sheet1.csv
- Imported rows: 25,812
- Transport relations rebuilt:
  - transport_depots: 25,222
  - transport_poi_clients: 16,519
- Integrity check:
  - links without source codes: 0 for both junction tables

## Key transport_data quality after rebuild
- total: 25,812
- otdcode non-null: 25,812
- sitcode non-null: 25,441
- tiecode non-null: 25,812
- voycle non-null: 25,812
- salnom non-null: 25,812
- plamoti non-null: 25,812
- artcode non-null: 25,243
- affcode non-null: 3,898

## Notes
- The previous null-heavy transport_data state has been replaced.
- Importer now includes header normalization and fails fast if business key coverage is zero.
- This prevents future imports that silently null key transport columns.
