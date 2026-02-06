const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');

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

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('Configuração em falta: JWT_SECRET');
    err.status = 500;
    throw err;
  }
  return secret;
}

function safeUserJson(user) {
  if (!user) return null;
  const json = typeof user.toJSON === 'function' ? user.toJSON() : user;
  // nunca devolver senha
  const { senha: _senha, ...rest } = json;
  return rest;
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
