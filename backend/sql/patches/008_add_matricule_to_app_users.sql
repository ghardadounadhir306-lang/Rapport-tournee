-- Add matricule column to app_users (safe to run multiple times)
ALTER TABLE app_users
  ADD COLUMN IF NOT EXISTS matricule VARCHAR(100) NULL DEFAULT NULL
    COMMENT 'Employee / driver matricule number'
  AFTER role;
