-- 03_roles_update.sql
-- Run this in pgAdmin on an EXISTING DB created previously with only ('admin','user') allowed.
-- Expands utilizador.tipo allowed values to: admin, secretaria, medico, user.

BEGIN;

DO $$
DECLARE
  c RECORD;
BEGIN
  -- Drop any CHECK constraint on utilizador.tipo (name can vary)
  FOR c IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'utilizador'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%tipo%'
      AND pg_get_constraintdef(oid) ILIKE '%IN%'
  ) LOOP
    EXECUTE format('ALTER TABLE utilizador DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE utilizador
  ADD CONSTRAINT utilizador_tipo_check
  CHECK (tipo IN ('admin','secretaria','medico','user'));

COMMIT;
