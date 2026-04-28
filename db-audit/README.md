# DB Audit Pack

Put exported CSVs in `db-audit/csv/`.

Run `db-audit/sql/inspect_current_db.sql` against the live database to capture:
- table list
- columns and types
- foreign keys
- indexes
- row counts
- sample rows

What I need from you after that:
- the CSV exports from the live tables
- the SQL output from `inspect_current_db.sql`
- the current backend entity files if they changed
