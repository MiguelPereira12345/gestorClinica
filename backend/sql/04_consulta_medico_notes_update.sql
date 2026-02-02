-- 04_consulta_medico_notes_update.sql
-- Run this in pgAdmin on an EXISTING DB.
--
-- 1) Make consulta.id_medico reference utilizador(id) (tipo='medico') instead of medico(id_medico)
-- 2) Add consulta.razao_consulta and consulta.notas_internas columns

BEGIN;

-- Add columns if missing
ALTER TABLE consulta
  ADD COLUMN IF NOT EXISTS razao_consulta TEXT;

ALTER TABLE consulta
  ADD COLUMN IF NOT EXISTS notas_internas TEXT;

-- Drop existing FK constraints that mention id_medico (name can vary)
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'consulta'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%id_medico%'
  ) LOOP
    EXECUTE format('ALTER TABLE consulta DROP CONSTRAINT IF EXISTS %I', c.conname);
  END LOOP;
END $$;

-- Re-add FK to utilizador(id)
-- Nota: se existirem valores antigos que apontavam para medico(id_medico), estes podem não existir em utilizador.
-- Para permitir criar a constraint, limpamos (NULL) ids inválidos.
UPDATE consulta c
SET id_medico = NULL
WHERE c.id_medico IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM utilizador u WHERE u.id = c.id_medico);

ALTER TABLE consulta
  ADD CONSTRAINT consulta_id_medico_fkey
  FOREIGN KEY (id_medico)
  REFERENCES utilizador(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

COMMIT;
