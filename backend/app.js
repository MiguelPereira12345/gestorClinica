require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
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

// Captura erros inesperados do processo (útil em produção)
process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[process] uncaughtException:', err);
});

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

// Diagnóstico de JWT (sem expor segredos)
app.get('/health/jwt', (_req, res) => {
  const secret = process.env.JWT_SECRET;
  const hasSecret = secret != null && String(secret).trim() !== '';
  const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
  return res.status(hasSecret ? 200 : 500).json({
    ok: hasSecret,
    expiresIn,
    secretLength: hasSecret ? String(secret).trim().length : 0,
  });
});

// Diagnóstico de ligação à BD (útil no Render)
app.get('/health/db', async (_req, res) => {
  try {
    await sequelize.authenticate();

    const [metaRows] = await sequelize.query(
      'SELECT 1 AS ok, current_database() AS db, current_user AS db_user;'
    );
    const meta = Array.isArray(metaRows) && metaRows[0] ? metaRows[0] : {};

    const [regRows] = await sequelize.query(
      "SELECT to_regclass('public.utilizador') AS utilizador;"
    );
    const utilizadorExists = Boolean(Array.isArray(regRows) && regRows[0] && regRows[0].utilizador);

    let counts = null;
    if (utilizadorExists) {
      const [countRows] = await sequelize.query(
        "SELECT COUNT(*)::int AS total, SUM(CASE WHEN tipo IN ('admin','medico') THEN 1 ELSE 0 END)::int AS staff FROM utilizador;"
      );
      counts = Array.isArray(countRows) && countRows[0] ? countRows[0] : null;
    }

    const ok = meta.ok === 1 || meta.ok === '1';
    return res.status(200).json({
      ok: Boolean(ok),
      db: meta.db,
      db_user: meta.db_user,
      utilizadorExists,
      counts,
    });
  } catch (err) {
    console.error('[health/db] erro:', err);
    return res.status(500).json({ ok: false, message: err?.message || 'DB error' });
  }
});

const models = initModels(sequelize);

async function ensureDatabaseSchema() {
  // Falha típica no Render: BD vazia sem as tabelas -> "relation 'utilizador' does not exist".
  // Se a tabela principal não existir, cria o schema com Sequelize (não faz drop de dados).
  try {
    await sequelize.authenticate();

    const [rows] = await sequelize.query(
      "SELECT to_regclass('public.utilizador') AS regclass;"
    );
    const exists = Array.isArray(rows) && rows[0] && rows[0].regclass;
    if (!exists) {
      console.log('[db] Schema em falta. A criar tabelas...');
      await sequelize.sync();
      console.log('[db] Tabelas criadas.');
    }

    // Bootstrap opcional: cria um admin inicial numa BD vazia.
    // Define estas env vars no Render (Backend):
    // BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_TELEFONE, BOOTSTRAP_ADMIN_NOME
    const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
    const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
    const bootstrapTelefone = process.env.BOOTSTRAP_ADMIN_TELEFONE;
    const bootstrapNome = process.env.BOOTSTRAP_ADMIN_NOME;

    if (bootstrapEmail && bootstrapPassword && bootstrapTelefone && bootstrapNome && models?.User) {
      const adminCount = await models.User.count({ where: { tipo: 'admin' } });
      if (adminCount === 0) {
        console.log('[db] A criar utilizador admin inicial (bootstrap)...');
        const senhaHash = await bcrypt.hash(String(bootstrapPassword), 10);
        await models.User.create({
          nome: String(bootstrapNome),
          email: String(bootstrapEmail).trim().toLowerCase(),
          telefone: String(bootstrapTelefone),
          omd: null,
          tipo: 'admin',
          ativo: true,
          senha: senhaHash,
        });
        console.log('[db] Admin inicial criado.');
      }
    }

    // Reset opcional de password via env (útil quando os emails são fictícios).
    // Define no Render (Backend) e faz restart/redeploy:
    // RESET_PASSWORD_EMAIL, RESET_PASSWORD_NEW
    const resetEmail = process.env.RESET_PASSWORD_EMAIL;
    const resetNewPassword = process.env.RESET_PASSWORD_NEW;
    if (resetEmail && resetNewPassword && models?.User) {
      const emailNorm = String(resetEmail).trim().toLowerCase();
      const user = await models.User.findOne({
        where: sequelize.where(
          sequelize.fn('lower', sequelize.fn('trim', sequelize.col('email'))),
          emailNorm
        ),
      });

      if (!user) {
        console.warn(`[db] RESET_PASSWORD_EMAIL: utilizador não encontrado (${emailNorm})`);
      } else {
        console.log(`[db] A atualizar password (reset via env) para ${emailNorm}...`);
        const senhaHash = await bcrypt.hash(String(resetNewPassword), 10);
        await user.update({ senha: senhaHash });
        console.log('[db] Password atualizada (reset via env).');
      }
    }
  } catch (err) {
    console.error('[db] Erro ao preparar BD:', err);
    // Re-throw para impedir o servidor de arrancar em estado inválido
    throw err;
  }
}

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

// Middleware de erro (deve ficar depois das rotas)
app.use((err, req, res, _next) => {
  console.error('[express] error:', {
    method: req?.method,
    url: req?.originalUrl || req?.url,
    message: err?.message,
    stack: err?.stack,
  });
  if (res.headersSent) return;
  res.status(err?.status || 500).json({ message: err?.message || 'Erro do servidor.' });
});

ensureDatabaseSchema()
  .then(() => {
    app.listen(app.get('port'), '0.0.0.0', () => {
      console.log(`Porto: ${app.get('port')}`);
    });
  })
  .catch(() => {
    process.exitCode = 1;
  });

