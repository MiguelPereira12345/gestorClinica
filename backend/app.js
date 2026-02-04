require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
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

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

initModels(sequelize);

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

// Serve frontend (build) quando disponível
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

app.listen(app.get('port'), '0.0.0.0', () => {
  console.log(`Porto: ${app.get('port')}`);
});

