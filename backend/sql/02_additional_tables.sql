-- Run this in pgAdmin connected to your clinic DB
-- Creates missing tables needed for: refresh tokens, consents, medical records, schedules, files, notifications, declarations, audit logs.

BEGIN;

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
  uploaded_by INTEGER NULL REFERENCES utilizador(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes INTEGER NULL,
  storage_path VARCHAR(500) NOT NULL,
  kind VARCHAR(80) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_file_patient ON clinical_file(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_file_consulta ON clinical_file(consulta_id);

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

COMMIT;
