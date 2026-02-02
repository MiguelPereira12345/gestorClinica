const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');

const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');

const models = initModels(sequelize);
const { User, RefreshToken } = models;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Configuração em falta: JWT_SECRET');
    err.status = 500;
    throw err;
  }
  return secret;
}

function signAccessToken(user) {
  const secret = getSecret();
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      nome: user.nome,
      tipo: user.tipo,
    },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function parseRefreshTtlMs() {
  const raw = process.env.REFRESH_TOKEN_TTL_DAYS;
  const days = raw ? Number(raw) : 30;
  const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
  return safeDays * 24 * 60 * 60 * 1000;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

async function verifyPassword(user, senha) {
  if (!user?.senha) return false;
  if (user.senha && /^\$2[aby]\$/.test(user.senha)) {
    return bcrypt.compare(String(senha), user.senha);
  }
  return user.senha === senha;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim();
  return req.ip || null;
}

function userAgent(req) {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua.slice(0, 255) : null;
}

async function issueRefreshToken({ userId, req }) {
  const token = crypto.randomBytes(48).toString('hex');
  const ttlMs = parseRefreshTtlMs();
  const expiresAt = new Date(Date.now() + ttlMs);

  const record = await RefreshToken.create({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expiresAt,
    revoked_at: null,
    ip: clientIp(req),
    user_agent: userAgent(req),
  });

  return { token, expiresAt, id: record.id_refresh_token };
}

async function revokeRefreshToken(token) {
  const tokenHash = hashToken(token);
  const rec = await RefreshToken.findOne({ where: { token_hash: tokenHash } });
  if (!rec) return false;
  if (rec.revoked_at) return true;
  await rec.update({ revoked_at: new Date() });
  return true;
}

async function rotateRefreshToken({ refreshToken, req }) {
  const tokenHash = hashToken(refreshToken);
  const rec = await RefreshToken.findOne({ where: { token_hash: tokenHash } });

  if (!rec) {
    return { ok: false, reason: 'Refresh token inválido' };
  }

  if (rec.revoked_at) {
    return { ok: false, reason: 'Refresh token revogado' };
  }

  if (new Date(rec.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: 'Refresh token expirado' };
  }

  // revoke old
  await rec.update({ revoked_at: new Date() });

  const user = await User.findByPk(rec.user_id);
  if (!user || !user.ativo) {
    return { ok: false, reason: 'Utilizador inválido/inativo' };
  }

  const newRefresh = await issueRefreshToken({ userId: user.id, req });
  const accessToken = signAccessToken(user);

  return {
    ok: true,
    accessToken,
    refreshToken: newRefresh.token,
    refreshExpiresAt: newRefresh.expiresAt,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
    },
  };
}

exports.login_admin = async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const emailNorm = String(email).trim().toLowerCase();

    const user = await User.findOne({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('lower', sequelize.fn('trim', sequelize.col('email'))),
            emailNorm
          ),
        ],
        tipo: { [Op.in]: ['admin', 'secretaria', 'medico'] },
        ativo: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas ou sem permissão' });
    }

    const ok = await verifyPassword(user, senha);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = signAccessToken(user);
    const refresh = await issueRefreshToken({ userId: user.id, req });

    return res.json({
      token,
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
      user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo },
    });
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Erro no login' });
  }
};

exports.login_paciente = async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const emailNorm = String(email).trim().toLowerCase();

    const user = await User.findOne({
      where: {
        [Op.and]: [
          sequelize.where(
            sequelize.fn('lower', sequelize.fn('trim', sequelize.col('email'))),
            emailNorm
          ),
        ],
        tipo: 'user',
        ativo: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const ok = await verifyPassword(user, senha);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = signAccessToken(user);
    const refresh = await issueRefreshToken({ userId: user.id, req });

    return res.json({
      token,
      refreshToken: refresh.token,
      refreshExpiresAt: refresh.expiresAt,
      user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo },
    });
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Erro no login' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken é obrigatório' });
    }

    const out = await rotateRefreshToken({ refreshToken, req });
    if (!out.ok) {
      return res.status(401).json({ message: out.reason || 'Refresh token inválido' });
    }

    return res.json({
      token: out.accessToken,
      refreshToken: out.refreshToken,
      refreshExpiresAt: out.refreshExpiresAt,
      user: out.user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao refrescar token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken é obrigatório' });
    }

    await revokeRefreshToken(refreshToken);
    return res.status(200).json({ message: 'Logout efetuado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro no logout' });
  }
};

exports.me = async (req, res) => {
  try {
    // req.user vem do verificarToken
    return res.status(200).json({ user: req.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao obter utilizador' });
  }
};
