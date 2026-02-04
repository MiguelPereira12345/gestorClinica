-- 04_remove_secretaria_role.sql
-- Remove o cargo/role "secretaria" do sistema.
-- - Migra dados: secretaria -> admin
-- - Atualiza CHECK constraint de utilizador.tipo para permitir apenas: admin, medico, user
--
-- Nota: Executar depois de atualizar o backend/frontend para não referirem "secretaria".

BEGIN;

-- 1) Migrar registos existentes
UPDATE utilizador
SET tipo = 'admin'
WHERE tipo = 'secretaria';

-- 2) Recriar CHECK constraint de forma idempotente
DO $$
DECLARE
  c RECORD;
BEGIN
  IF to_regclass('public.utilizador') IS NOT NULL THEN
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

    ALTER TABLE utilizador
      ADD CONSTRAINT utilizador_tipo_check
      CHECK (tipo IN ('admin','medico','user'));
  END IF;
END $$;

COMMIT;
