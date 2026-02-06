const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const { sendMail, isMailConfigured } = require('../utils/mailer');

const models = initModels(sequelize);
const { User } = models;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function env(name, fallback = '') {
  return process.env[name] != null && String(process.env[name]).trim() !== ''
    ? String(process.env[name]).trim()
    : fallback;
}

function inferPublicOrigin(req) {
  if (!req) return '';
  // Se o request veio do browser (CORS), o header Origin normalmente indica o frontend.
  // Isto é útil quando o frontend e backend estão em domínios diferentes.
  const origin = req.headers?.origin;
  if (typeof origin === 'string') {
    const o = origin.trim();
    if (o.startsWith('http://') || o.startsWith('https://')) return o;
  }
  const xfProto = req.headers?.['x-forwarded-proto'];
  const proto = (typeof xfProto === 'string' && xfProto.trim())
    ? xfProto.split(',')[0].trim()
    : (req.protocol || 'https');
  const xfHost = req.headers?.['x-forwarded-host'];
  const host = (typeof xfHost === 'string' && xfHost.trim())
    ? xfHost.split(',')[0].trim()
    : (typeof req.get === 'function' ? req.get('host') : '');
  if (!host) return '';
  return `${proto}://${host}`;
}

function publicResetBaseUrl(req) {
  // URL pública do frontend (página Recuperarpass). Ajustável via env.
  // 1) FRONTEND_RESET_URL (url completa)
  // 2) FRONTEND_BASE_URL (origem do frontend)
  // 3) inferido do request (origin/host)
  const explicit = env('FRONTEND_RESET_URL', '');
  if (explicit) return explicit;

  const base = env('FRONTEND_BASE_URL', '') || inferPublicOrigin(req);
  const clean = String(base || '').replace(/\/+$/, '');
  // O frontend usa HashRouter, por isso a rota tem de incluir "#/" para abrir a página certa.
  return clean ? `${clean}/#/recuperar-palavra-passe` : '/#/recuperar-palavra-passe';
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Configuração em falta: JWT_SECRET');
    err.status = 500;
    throw err;
  }
  return secret;
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function safeUserJson(user) {
  if (!user) return null;
  const json = typeof user.toJSON === 'function' ? user.toJSON() : user;
  // nunca devolver senha
  const { senha: _senha, ...rest } = json;
  return rest;
}

// In-memory store para códigos de recuperação (dev-friendly).
// Nota: perde-se ao reiniciar o servidor.
const resetCodeStore = new Map();

function setResetCode(email, code, ttlMs) {
  resetCodeStore.set(email, {
    codeHash: hash(code),
    expiresAt: Date.now() + ttlMs,
  });
}

function consumeResetCode(email, code) {
  const rec = resetCodeStore.get(email);
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    resetCodeStore.delete(email);
    return false;
  }
  const ok = rec.codeHash === hash(code);
  if (ok) resetCodeStore.delete(email);
  return ok;
}

async function findUserByEmail(emailNorm) {
  return User.findOne({
    where: {
      [Op.and]: [
        sequelize.where(
          sequelize.fn('lower', sequelize.fn('trim', sequelize.col('email'))),
          emailNorm
        ),
      ],
    },
  });
}

async function ensureEmailTelefoneUnique({ email, telefone, excludeUserId } = {}) {
  const checks = [];
  if (email) {
    checks.push(
      User.findOne({
        where: {
          email,
          ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}),
        },
      }).then((u) => (u ? { field: 'email' } : null))
    );
  }
  if (telefone) {
    checks.push(
      User.findOne({
        where: {
          telefone,
          ...(excludeUserId ? { id: { [Op.ne]: excludeUserId } } : {}),
        },
      }).then((u) => (u ? { field: 'telefone' } : null))
    );
  }
  const results = await Promise.all(checks);
  return results.find(Boolean) || null;
}

const controller = {};

controller.password_reset_request = async (req, res) => {
  try {
    const { email, via } = req.body || {};
    const emailNorm = normalizeEmail(email);

    // Resposta neutra para evitar enumeração.
    const okMessage =
      'Se existir uma conta com esse e-mail, enviamos as instruções de recuperação.';

    if (!emailNorm) {
      return res.status(200).json({ message: okMessage });
    }

    const user = await findUserByEmail(emailNorm);
    if (!user || !user.ativo) {
      return res.status(200).json({ message: okMessage });
    }

    const method = String(via || 'link').toLowerCase() === 'code' ? 'code' : 'link';
    const ttlMinutes = Number(env('PASSWORD_RESET_TTL_MIN', '15')) || 15;
    const ttlMs = ttlMinutes * 60 * 1000;

    if (method === 'code') {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setResetCode(emailNorm, code, ttlMs);

      if (isMailConfigured()) {
        // Envio assíncrono (não bloqueante) para evitar timeouts
        sendMail({
          to: user.email,
          subject: 'Recuperação de palavra-passe',
          text: `O seu código de recuperação é: ${code}. Expira em ${ttlMinutes} minutos.`,
        }).catch(err => console.error('[Recover] Erro envio email (código):', err));

        return res.status(200).json({ message: okMessage });
      }

      // Sem SMTP: devolver código apenas para ambiente de desenvolvimento/testes.
      return res.status(200).json({
        message: okMessage,
        debugCode: code,
      });
    }

    // via link
    const secret = getJwtSecret();
    const token = jwt.sign(
      { purpose: 'password_reset', email: emailNorm },
      secret,
      { expiresIn: `${ttlMinutes}m` }
    );

    const url = `${publicResetBaseUrl(req)}?token=${encodeURIComponent(token)}`;

    if (isMailConfigured()) {
      // Envio assíncrono (não bloqueante)
      sendMail({
        to: user.email,
        subject: 'Recuperação de palavra-passe',
        text: `Para redefinir a sua palavra-passe, abra este link (expira em ${ttlMinutes} minutos): ${url}`,
      }).catch(err => console.error('[Recover] Erro envio email (link):', err));

      return res.status(200).json({ message: okMessage });
    }

    return res.status(200).json({
      message: okMessage,
      debugLink: url,
    });
  } catch (err) {
    console.error('password_reset_request error:', err);
    // Mesmo em erro, manter mensagem neutra.
    return res.status(200).json({
      message: 'Se existir uma conta com esse e-mail, enviamos as instruções de recuperação.',
    });
  }
};

controller.password_reset_confirm = async (req, res) => {
  try {
    const { token, email, code, newPassword } = req.body || {};
    const senha = String(newPassword || '').trim();
    if (!senha || senha.length < 6) {
      return res.status(400).json({ message: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    let emailNorm = '';
    if (token) {
      const secret = getJwtSecret();
      const decoded = jwt.verify(String(token), secret);
      if (!decoded || decoded.purpose !== 'password_reset' || !decoded.email) {
        return res.status(400).json({ message: 'Token inválido.' });
      }
      emailNorm = normalizeEmail(decoded.email);
    } else {
      emailNorm = normalizeEmail(email);
      if (!emailNorm || !code) {
        return res.status(400).json({ message: 'Email e código são obrigatórios.' });
      }
      const ok = consumeResetCode(emailNorm, String(code).trim());
      if (!ok) {
        return res.status(400).json({ message: 'Código inválido ou expirado.' });
      }
    }

    const user = await findUserByEmail(emailNorm);
    if (!user || !user.ativo) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    const hashed = await bcrypt.hash(senha, 10);
    await user.update({ senha: hashed });
    return res.status(200).json({ message: 'Palavra-passe atualizada com sucesso.' });
  } catch (err) {
    console.error('password_reset_confirm error:', err);
    if (err && (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError')) {
      return res.status(400).json({ message: 'Token inválido ou expirado.' });
    }
    return res.status(500).json({ message: 'Erro do servidor.' });
  }
};

controller.criar_utilizador = async (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      senha,
      tipo = 'user',
      sexo,
      endereco,
      nif,
      data_nascimento,
      numero_utente,
      omd,
    } = req.body || {};

    if (!nome || !email || !telefone || !senha) {
      return res.status(400).json({ message: 'Campos obrigatórios em falta' });
    }

    const emailNorm = normalizeEmail(email);
    const conflict = await ensureEmailTelefoneUnique({ email: emailNorm, telefone });
    if (conflict?.field === 'email') return res.status(409).json({ message: 'Email já registado' });
    if (conflict?.field === 'telefone')
      return res.status(409).json({ message: 'Telefone já registado' });

    const hashed = await bcrypt.hash(String(senha), 10);
    const newUser = await User.create({
      nome,
      email: emailNorm,
      telefone,
      senha: hashed,
      tipo,
      sexo,
      endereco,
      nif,
      data_nascimento,
      numero_utente,
      omd,
      ativo: true,
    });

    return res.status(201).json({
      message: 'Utilizador criado com sucesso',
      utilizador: safeUserJson(newUser),
    });
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

controller.get_utilizadores = async (_req, res) => {
  try {
    const utilizadores = await User.findAll({
      where: { tipo: 'user', ativo: true },
      attributes: { exclude: ['senha'] },
      order: [['id', 'DESC']],
    });
    return res.status(200).json({ utilizadores });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

controller.get_todos_utilizadores = async (_req, res) => {
  try {
    const utilizadores = await User.findAll({
      attributes: { exclude: ['senha'] },
      order: [['id', 'DESC']],
    });
    return res.status(200).json({ utilizadores });
  } catch (error) {
    console.error('Erro ao listar todos utilizadores:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

controller.procurar_utilizadores = async (req, res) => {
  try {
    const nome = String(req.query?.nome || '').trim();
    if (!nome) return res.status(200).json({ utilizadores: [] });

    const utilizadores = await User.findAll({
      where: {
        nome: { [Op.iLike]: `%${nome}%` },
      },
      attributes: { exclude: ['senha'] },
      order: [['id', 'DESC']],
    });
    return res.status(200).json({ utilizadores });
  } catch (error) {
    console.error('Erro ao procurar utilizadores:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

controller.get_utilizador_by_id = async (req, res) => {
  try {
    const id = Number(req.params?.id);
    if (!Number.isFinite(id) || !id) return res.status(400).json({ message: 'ID inválido' });
    const user = await User.findByPk(id, { attributes: { exclude: ['senha'] } });
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });
    return res.status(200).json({ utilizador: safeUserJson(user) });
  } catch (error) {
    console.error('Erro ao obter utilizador:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

controller.atualizar_utilizador = async (req, res) => {
  try {
    const id = Number(req.params?.id);
    if (!Number.isFinite(id) || !id) return res.status(400).json({ message: 'ID inválido' });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });

    const patch = { ...req.body };
    if (patch.email != null) patch.email = normalizeEmail(patch.email);

    const conflict = await ensureEmailTelefoneUnique({
      email: patch.email,
      telefone: patch.telefone,
      excludeUserId: id,
    });
    if (conflict?.field === 'email') return res.status(409).json({ message: 'Email já registado' });
    if (conflict?.field === 'telefone')
      return res.status(409).json({ message: 'Telefone já registado' });

    if (patch.senha) {
      patch.senha = await bcrypt.hash(String(patch.senha), 10);
    } else {
      delete patch.senha;
    }

    await user.update(patch);
    return res.status(200).json({
      message: 'Utilizador atualizado com sucesso',
      utilizador: safeUserJson(user),
    });
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

controller.desativar_utilizador = async (req, res) => {
  try {
    const id = Number(req.params?.id);
    if (!Number.isFinite(id) || !id) return res.status(400).json({ message: 'ID inválido' });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });
    await user.update({ ativo: false });
    return res.status(200).json({ message: 'Utilizador desativado', utilizador: safeUserJson(user) });
  } catch (error) {
    console.error('Erro ao desativar utilizador:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

controller.apagar_utilizador = async (req, res) => {
  try {
    const id = Number(req.params?.id);
    if (!Number.isFinite(id) || !id) return res.status(400).json({ message: 'ID inválido' });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Utilizador não encontrado' });
    await user.destroy();
    return res.status(200).json({ message: 'Utilizador apagado com sucesso' });
  } catch (error) {
    console.error('Erro ao apagar utilizador:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

module.exports = controller;
