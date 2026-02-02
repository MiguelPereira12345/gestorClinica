require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors'); 
const route = require("./src/routes/route");
const planoRoute = require("./src/routes/route.plano");
const dependentesRoute = require("./src/routes/route.dependentes");
const consultaRoute = require("./src/routes/route.consulta");
const gestorRoute = require("./src/routes/route.gestor");
const utilizadoresRoute = require("./src/routes/route.utilizadores");
const historicoRoute = require("./src/routes/route.historico");
const authRoute = require("./src/routes/route.auth");
const patientRoute = require("./src/routes/route.patient");
const medicalRecordRoute = require("./src/routes/route.medicalRecord");
const scheduleRoute = require("./src/routes/route.schedule");
const fileRoute = require("./src/routes/route.file");
const notificationRoute = require("./src/routes/route.notification");
const declarationRoute = require("./src/routes/route.declaration");
const auditRoute = require("./src/routes/route.audit");
const { verificarToken, requireRole } = require('./src/middleware/authMiddleware');



const sequelize = require('./src/models/database');  
const { initModels } = require("./src/models/init-models");  

app.set('port', process.env.PORT || 3001);

app.use(express.json());
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })
);

initModels(sequelize);

// Testa a conexão com a base de dados
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com a base de dados estabelecida com sucesso!');

    // Migrações mínimas e idempotentes para bases antigas.
    // Evita 500 em /files quando clinical_file não tem as colunas esperadas.
    // Nota: o script SQL único continua a ser a fonte principal; isto é só um safety-net.
    try {
      // Create table if missing (lightweight; matches model expectations)
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS clinical_file (
          id_file INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          patient_id INTEGER NULL REFERENCES utilizador(id) ON DELETE CASCADE,
          consulta_id INTEGER NULL REFERENCES consulta(id_consulta) ON DELETE SET NULL,
          uploaded_by INTEGER NULL REFERENCES utilizador(id) ON DELETE SET NULL,
          file_name VARCHAR(255) NOT NULL,
          mime_type VARCHAR(120) NULL,
          size_bytes INTEGER NULL,
          storage_path VARCHAR(500) NOT NULL,
          kind VARCHAR(80) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Ensure expected columns exist (older DBs could have a partial schema)
      await sequelize.query(`
        ALTER TABLE clinical_file
          ADD COLUMN IF NOT EXISTS consulta_id INTEGER NULL REFERENCES consulta(id_consulta) ON DELETE SET NULL;
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_clinical_file_patient ON clinical_file(patient_id);
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_clinical_file_consulta ON clinical_file(consulta_id);
      `);
    } catch (migrationErr) {
      // Não bloquear o arranque, mas logar para diagnóstico.
      console.error('Aviso: migração automática (clinical_file) falhou:', migrationErr);
    }
  } catch (error) {
    console.error(' Erro ao conectar à base de dados:', error);
    process.exit(1);
  }
};

// Inicia o servidor
connectDB().then(() => {
  app.listen(app.get('port'), () => {
    console.log(` Servidor a correr na porta ${app.get('port')}`);
  });
});

//Login
app.use("/login", route);

// Auth (admin + paciente + refresh/logout)
app.use('/auth', authRoute);

// Rotas de plano
app.use('/plano', verificarToken, requireRole('admin', 'medico'), planoRoute);

// Rotas de dependentes
app.use('/dependentes', verificarToken, requireRole('admin'), dependentesRoute);

// Rotas de consultas
app.use('/consultas', verificarToken, requireRole('admin', 'medico'), consultaRoute);

// Rotas de gestores
app.use('/gestores', verificarToken, requireRole('admin', 'medico'), gestorRoute);

// Rotas de utilizadores
app.use('/utilizadores', utilizadoresRoute);

// Patients + consentimentos (admin ou o próprio paciente)
app.use('/patients', patientRoute);

// Registos clínicos (apenas admin)
app.use('/medical-records', medicalRecordRoute);

// Horários/feriados/ocupação (apenas admin)
app.use('/schedule', verificarToken, requireRole('admin'), scheduleRoute);

// Ficheiros clínicos: upload/delete admin, list/download admin ou próprio
app.use('/files', verificarToken, fileRoute);

// Notificações: list/read self ou admin; criar só admin
app.use('/notifications', verificarToken, notificationRoute);

// Declarações: list/download self ou admin; criar só admin
app.use('/declarations', verificarToken, declarationRoute);

// Auditoria: apenas admin
app.use('/audit', verificarToken, requireRole('admin'), auditRoute);

// Rotas de histórico médico
app.use('/api', verificarToken, requireRole('admin'), historicoRoute);

app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

