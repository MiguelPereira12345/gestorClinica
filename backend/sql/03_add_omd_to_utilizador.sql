-- Adiciona o campo OMD (5 dígitos) ao utilizador (utilizador.tipo='medico')
-- Nota: a app valida como obrigatório para médicos; a BD permite NULL.

ALTER TABLE utilizador
ADD COLUMN IF NOT EXISTS omd VARCHAR(5);
