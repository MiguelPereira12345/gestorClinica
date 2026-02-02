-- gestorClinica_init.sql
-- Schema base (PostgreSQL) para importação no pgAdmin.

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

CREATE TABLE IF NOT EXISTS consulta (
  id_consulta      INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Nota: id_medico refere-se ao utilizador (tipo='medico'), não à tabela medico.
  id_medico        INTEGER NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE SET NULL,
  duracao          INTEGER,
  tipo_de_marcacao VARCHAR(50),
  status           VARCHAR(50),
  data_consulta    DATE NOT NULL,
  id               INTEGER NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE SET NULL,
  hora             TIME NOT NULL,
  razao_consulta   TEXT,
  notas_internas   TEXT
);

CREATE INDEX IF NOT EXISTS idx_consulta_data ON consulta (data_consulta);
CREATE INDEX IF NOT EXISTS idx_consulta_paciente ON consulta (id);
CREATE INDEX IF NOT EXISTS idx_consulta_medico ON consulta (id_medico);

CREATE TABLE IF NOT EXISTS plano_tratamento (
  id_tratamento INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_inicio   DATE,
  data_fim      DATE,
  descricao     TEXT,
  status        VARCHAR(50),
  id            INTEGER NOT NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_plano_paciente ON plano_tratamento (id);

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

CREATE TABLE IF NOT EXISTS historico_medico (
  id_historico INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id           INTEGER NULL REFERENCES utilizador(id) ON UPDATE CASCADE ON DELETE SET NULL,
  medicamentos TEXT,
  alergias     TEXT,
  gravidade    TEXT,
  internacoes  TEXT
);

CREATE INDEX IF NOT EXISTS idx_historico_paciente ON historico_medico (id);

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
