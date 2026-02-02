-- gestorClinica_init.sql
-- Script único (PostgreSQL) para importar no pgAdmin.
-- Inclui:
--  - schema base
--  - tabelas adicionais (refresh tokens, consentimentos, ficheiros, notificações, auditoria, etc.)
--  - migrações idempotentes para BD já existentes (roles, colunas e FK da consulta)

BEGIN;

-- Recria schema public limpo (opcional). Comenta se já tens tabelas.
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

CREATE TABLE IF NOT EXISTS utilizador (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  telefone        VARCHAR(50)  NOT NULL UNIQUE,
  tipo            VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (tipo IN ('admin','secretaria','medico','user')),
  ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
  data_inscricao  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  senha           VARCHAR(255) NOT NULL,
  sexo            VARCHAR(50),
  endereco        VARCHAR(255),
  nif             VARCHAR(50),
  data_nascimento DATE,
  numero_utente   VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS medico (
  id_medico     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome          VARCHAR(255) NOT NULL,
  especialidade VARCHAR(255)
);

-- Nota: `dependentes` tem de existir antes de `consulta` (FK id_dependente)
CREATE TABLE IF NOT EXISTS dependentes (
  id_dependente  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome           VARCHAR(255) NOT NULL,
  data_nascimento DATE NOT NULL,
  sexo           VARCHAR(50),
  nif            VARCHAR(50),
  numero_utente  VARCHAR(50),
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  id             INTEGER NOT NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dependentes_paciente ON dependentes (id);

CREATE TABLE IF NOT EXISTS plano_tratamento (
  id_tratamento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_inicio   DATE,
  data_fim      DATE,
  descricao     TEXT,
  status        VARCHAR(50),
  -- responsável (paciente) em utilizador.id
  id            INTEGER NOT NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE CASCADE,
  -- opcional: plano para um dependente (responsável em `id`)
  dependent_id  INTEGER NULL REFERENCES dependentes(id_dependente) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_plano_paciente ON plano_tratamento (id);
CREATE INDEX IF NOT EXISTS idx_plano_dependente ON plano_tratamento (dependent_id);

CREATE TABLE IF NOT EXISTS consulta (
  id_consulta      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Nota: id_medico refere-se ao utilizador (tipo='medico'), não à tabela medico.
  id_medico        INTEGER NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE SET NULL,
  duracao          INTEGER,
  tipo_de_marcacao VARCHAR(50),
  status           VARCHAR(50),
  data_consulta    DATE NOT NULL,
  id               INTEGER NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE SET NULL,
  -- Quando a consulta é para um dependente (responsável em `id`)
  id_dependente     INTEGER NULL REFERENCES dependentes(id_dependente) ON UPDATE CASCADE ON DELETE SET NULL,
  -- Consulta associada a um plano de tratamento (opcional)
  id_tratamento     INTEGER NULL REFERENCES plano_tratamento(id_tratamento) ON UPDATE CASCADE ON DELETE SET NULL,
  hora             TIME NOT NULL,
  razao_consulta   TEXT,
  notas_internas   TEXT
);

CREATE INDEX IF NOT EXISTS idx_consulta_data ON consulta (data_consulta);
CREATE INDEX IF NOT EXISTS idx_consulta_paciente ON consulta (id);
CREATE INDEX IF NOT EXISTS idx_consulta_medico ON consulta (id_medico);
CREATE INDEX IF NOT EXISTS idx_consulta_dependente ON consulta (id_dependente);
CREATE INDEX IF NOT EXISTS idx_consulta_tratamento ON consulta (id_tratamento);

CREATE TABLE IF NOT EXISTS historico_medico (
  id_historico INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id           INTEGER NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE SET NULL,
  medicamentos TEXT,
  alergias     TEXT,
  gravidade    TEXT,
  internacoes  TEXT
);

CREATE INDEX IF NOT EXISTS idx_historico_paciente ON historico_medico (id);

-- =========================================
-- Migrações idempotentes (para BD existentes)
-- =========================================

-- Garantir que utilizador.tipo permite: admin, secretaria, medico, user
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
      CHECK (tipo IN ('admin','secretaria','medico','user'));
  END IF;
END $$;

-- Garantir colunas e FK da consulta para utilizador(id)
DO $$
DECLARE
  c RECORD;
BEGIN
  IF to_regclass('public.consulta') IS NOT NULL THEN
    ALTER TABLE consulta ADD COLUMN IF NOT EXISTS razao_consulta TEXT;
    ALTER TABLE consulta ADD COLUMN IF NOT EXISTS notas_internas TEXT;
    ALTER TABLE consulta ADD COLUMN IF NOT EXISTS id_dependente INTEGER;
    ALTER TABLE consulta ADD COLUMN IF NOT EXISTS id_tratamento INTEGER;

    -- Drop existing FK constraints that mention id_medico (name can vary)
    FOR c IN (
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'consulta'::regclass
        AND contype = 'f'
        AND pg_get_constraintdef(oid) ILIKE '%id_medico%'
    ) LOOP
      EXECUTE format('ALTER TABLE consulta DROP CONSTRAINT IF EXISTS %I', c.conname);
    END LOOP;

    -- Limpar ids inválidos antes de criar a constraint
    UPDATE consulta c
    SET id_medico = NULL
    WHERE c.id_medico IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM utilizador u WHERE u.id = c.id_medico);

    -- Re-add FK to utilizador(id)
    ALTER TABLE consulta
      ADD CONSTRAINT consulta_id_medico_fkey
      FOREIGN KEY (id_medico)
      REFERENCES utilizador(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;

    -- FK opcional para dependentes
    IF to_regclass('public.dependentes') IS NOT NULL THEN
      BEGIN
        ALTER TABLE consulta
          ADD CONSTRAINT consulta_id_dependente_fkey
          FOREIGN KEY (id_dependente)
          REFERENCES dependentes(id_dependente)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END;
    END IF;

    -- FK opcional para plano de tratamento
    IF to_regclass('public.plano_tratamento') IS NOT NULL THEN
      -- Limpar ids inválidos antes de criar a constraint
      UPDATE consulta c
      SET id_tratamento = NULL
      WHERE c.id_tratamento IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM plano_tratamento p WHERE p.id_tratamento = c.id_tratamento);

      BEGIN
        ALTER TABLE consulta
          ADD CONSTRAINT consulta_id_tratamento_fkey
          FOREIGN KEY (id_tratamento)
          REFERENCES plano_tratamento(id_tratamento)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END;

      CREATE INDEX IF NOT EXISTS idx_consulta_tratamento ON consulta (id_tratamento);
    END IF;

    CREATE INDEX IF NOT EXISTS idx_consulta_dependente ON consulta (id_dependente);
  END IF;
END $$;

-- Garantir coluna e FK do plano para dependentes (para BD existentes)
DO $$
BEGIN
  IF to_regclass('public.plano_tratamento') IS NOT NULL THEN
    ALTER TABLE plano_tratamento ADD COLUMN IF NOT EXISTS dependent_id INTEGER;

    IF to_regclass('public.dependentes') IS NOT NULL THEN
      BEGIN
        ALTER TABLE plano_tratamento
          ADD CONSTRAINT plano_tratamento_dependent_id_fkey
          FOREIGN KEY (dependent_id)
          REFERENCES dependentes(id_dependente)
          ON UPDATE CASCADE
          ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_plano_dependente ON plano_tratamento (dependent_id);
  END IF;
END $$;

-- ==========================
-- Tabelas adicionais (extras)
-- ==========================

CREATE TABLE IF NOT EXISTS refresh_token (
  id_refresh_token INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES utilizador(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_token(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expires ON refresh_token(expires_at);

CREATE TABLE IF NOT EXISTS patient_consent (
  id_consent INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES utilizador(id) ON DELETE CASCADE,
  consent_type VARCHAR(80) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMP NULL,
  revoked_at TIMESTAMP NULL,
  notes TEXT NULL,
  CONSTRAINT uq_patient_consent UNIQUE (patient_id, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_patient_consent_patient ON patient_consent(patient_id);

CREATE TABLE IF NOT EXISTS medical_record (
  id_medical_record INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INTEGER NOT NULL UNIQUE REFERENCES utilizador(id) ON DELETE CASCADE,
  general_history TEXT NULL,
  dental_history TEXT NULL,
  habits TEXT NULL,
  clinical_observations TEXT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_schedule (
  id_schedule INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  medico_id INTEGER NOT NULL REFERENCES utilizador(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_doctor_schedule_medico ON doctor_schedule(medico_id);
CREATE INDEX IF NOT EXISTS idx_doctor_schedule_dow ON doctor_schedule(day_of_week);

CREATE TABLE IF NOT EXISTS holiday (
  id_holiday INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  description VARCHAR(200) NULL,
  is_closed BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS clinical_file (
  id_file INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INTEGER NULL REFERENCES utilizador(id) ON DELETE SET NULL,
  consulta_id INTEGER NULL REFERENCES consulta(id_consulta) ON DELETE SET NULL,
  dependent_id INTEGER NULL REFERENCES dependentes(id_dependente) ON DELETE SET NULL,
  uploaded_by INTEGER NULL REFERENCES utilizador(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes INTEGER NULL,
  storage_path VARCHAR(500) NOT NULL,
  kind VARCHAR(80) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Para BD antigas que já tinham clinical_file sem consulta_id
DO $$
BEGIN
  IF to_regclass('public.clinical_file') IS NOT NULL THEN
    ALTER TABLE clinical_file
      ADD COLUMN IF NOT EXISTS consulta_id INTEGER NULL REFERENCES consulta(id_consulta) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clinical_file_patient ON clinical_file(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_file_consulta ON clinical_file(consulta_id);
CREATE INDEX IF NOT EXISTS idx_clinical_file_dependent ON clinical_file(dependent_id);

CREATE TABLE IF NOT EXISTS notification (
  id_notification INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES utilizador(id) ON DELETE CASCADE,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NULL,
  scheduled_for TIMESTAMP NULL,
  sent_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id);

CREATE TABLE IF NOT EXISTS declaration (
  id_declaration INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES utilizador(id) ON DELETE CASCADE,
  consulta_id INTEGER NULL REFERENCES consulta(id_consulta) ON DELETE SET NULL,
  created_by INTEGER NULL REFERENCES utilizador(id) ON DELETE SET NULL,
  type VARCHAR(80) NOT NULL,
  payload_json TEXT NULL,
  pdf_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_declaration_patient ON declaration(patient_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id_audit INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id INTEGER NULL REFERENCES utilizador(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id VARCHAR(120) NULL,
  metadata_json TEXT NULL,
  ip VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- Seeds (password bcrypt para "admin123")
-- Hash gerado com bcrypt (cost 10). Se quiseres mudar, substitui o valor.
INSERT INTO utilizador (nome, email, telefone, tipo, ativo, senha)
VALUES ('Administrador', 'admin@clinica.local', '+351000000000', 'admin', TRUE, '$2b$10$ERaXI4sKPiJ41fFj1A8pFuL/bNClzjBZbR3t3hSs8moiCImbzTqcW')
ON CONFLICT (email) DO NOTHING;

-- Seeds de médicos (opcional)
INSERT INTO medico (nome, especialidade)
VALUES
  ('Dr. A', 'Geral'),
  ('Dra. B', 'Ortodontia'),
  ('Dr. C', 'Endodontia')
ON CONFLICT DO NOTHING;

COMMIT;
