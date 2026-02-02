-- Adds optional consulta_id to clinical_file so files can be attached to a consulta.
-- Run this after 02_additional_tables.sql if your DB already exists.

BEGIN;

ALTER TABLE clinical_file
  ADD COLUMN IF NOT EXISTS consulta_id INTEGER NULL REFERENCES consulta(id_consulta) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_file_consulta ON clinical_file(consulta_id);

COMMIT;
