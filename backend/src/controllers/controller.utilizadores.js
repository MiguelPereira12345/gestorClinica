const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const { Op } = require('sequelize');

const models = initModels(sequelize);
const { User } = models;

const controller = {};

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
// In-memory store: email -> { code, expiresAt }
// Nota: perde-se ao reiniciar o servidor (ok para dev).
const passwordResetCodes = new Map();

// In-memory store: tokenHash -> { email, expiresAt }
// Nota: perde-se ao reiniciar o servidor (ok para dev).
const passwordResetTokens = new Map();

const { sendMail, isMailConfigured } = require('../utils/mailer');

function generate6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function nowMs() {
  return Date.now();
}

function cleanupExpiredResetCodes() {
  const now = nowMs();
  for (const [emailKey, entry] of passwordResetCodes.entries()) {
    if (!entry || !entry.expiresAt || entry.expiresAt <= now) {
      passwordResetCodes.delete(emailKey);
    }
  }
}

function cleanupExpiredResetTokens() {
  const now = nowMs();
  for (const [tokenHash, entry] of passwordResetTokens.entries()) {
    if (!entry || !entry.expiresAt || entry.expiresAt <= now) {
      passwordResetTokens.delete(tokenHash);
    }
  }
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Pedir recuperação de password (link/código)
controller.password_reset_request = async (req, res) => {
  try {
    const { email, via } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const mode = via === 'code' ? 'code' : 'link';

    cleanupExpiredResetCodes();
    cleanupExpiredResetTokens();

    const user = await User.findOne({ where: { email: normalizedEmail } });

    // Resposta genérica para não revelar se existe conta.
    const response = {
      message:
        'Se existir uma conta com esse e-mail, serão enviadas instruções para recuperar a palavra-passe.',
      expiresInMinutes: 30,
    };

    if (user && mode === 'code') {
      // Gera código e guarda em memória
      const code = generate6DigitCode();
      passwordResetCodes.set(normalizedEmail, {
        codeHash: crypto.createHash('sha256').update(code).digest('hex'),
        expiresAt: nowMs() + PASSWORD_RESET_TTL_MS,
      });

      // Só devolve o código em dev para testes manuais
      if (process.env.NODE_ENV !== 'production') {
        response.debugCode = code;
      }
    }

    if (user && mode === 'link') {
      // Gera token de link e guarda hash em memória
      const token = generateResetToken();
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      passwordResetTokens.set(tokenHash, {
        email: normalizedEmail,
        expiresAt: nowMs() + PASSWORD_RESET_TTL_MS,
      });

      const frontendUrl = String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
      const resetLink = `${frontendUrl}/recuperar-palavra-passe?token=${encodeURIComponent(token)}`;

      if (isMailConfigured()) {
        const subject = 'Recuperação de palavra-passe';
        const text = `Recebemos um pedido para redefinir a sua palavra-passe.\n\nAbra este link para definir uma nova palavra-passe (expira em 30 minutos):\n${resetLink}\n\nSe não pediu esta alteração, ignore este email.`;
        const html = `
          <p>Recebemos um pedido para redefinir a sua palavra-passe.</p>
          <p><a href="${resetLink}">Clique aqui para definir uma nova palavra-passe</a> (expira em 30 minutos).</p>
          <p>Se não pediu esta alteração, ignore este email.</p>
        `;
        await sendMail({
          to: normalizedEmail,
          subject,
          text,
          html,
        });
      } else if (process.env.NODE_ENV !== 'production') {
        // Em dev, ajuda a testar mesmo sem SMTP
        response.debugLink = resetLink;
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Erro ao pedir recuperação de password:', error);
    return res.status(500).json({
      message: 'Erro do servidor',
      error: error.message,
    });
  }
};

// Confirmar redefinição de password via código
controller.password_reset_confirm = async (req, res) => {
  try {
    const { email, code, token, newPassword } = req.body || {};

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ message: 'Nova palavra-passe é obrigatória' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'A palavra-passe deve ter pelo menos 6 caracteres.' });
    }

    // Confirmar via token (link)
    if (token && typeof token === 'string') {
      cleanupExpiredResetTokens();
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
      const entry = passwordResetTokens.get(tokenHash);
      if (!entry?.email) {
        return res.status(400).json({ message: 'Link inválido ou expirado. Pede um novo link.' });
      }

      const user = await User.findOne({ where: { email: String(entry.email).trim().toLowerCase() } });
      if (user) {
        const hashed = await bcrypt.hash(String(newPassword), 10);
        await user.update({ senha: hashed });
      }

      // consumiu o token
      passwordResetTokens.delete(tokenHash);
      return res.status(200).json({ message: 'Palavra-passe atualizada com sucesso. Já pode iniciar sessão.' });
    }

    // Confirmar via código
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Código é obrigatório' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    cleanupExpiredResetCodes();
    const entry = passwordResetCodes.get(normalizedEmail);
    if (!entry) {
      return res.status(400).json({ message: 'Código inválido ou expirado. Pede um novo código.' });
    }

    const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    if (!entry.codeHash || entry.codeHash !== codeHash) {
      return res.status(400).json({ message: 'Código inválido. Verifica e tenta novamente.' });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      // Não revelar existência; mas também não faz sentido continuar.
      return res.status(200).json({ message: 'Se a conta existir, a palavra-passe foi atualizada.' });
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);
    await user.update({ senha: hashed });

    // consumiu o código
    passwordResetCodes.delete(normalizedEmail);

    return res.status(200).json({ message: 'Palavra-passe atualizada com sucesso. Já pode iniciar sessão.' });
  } catch (error) {
    console.error('Erro ao confirmar recuperação de password:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

// Criar utilizador
controller.criar_utilizador = async (req, res) => {
  try {
    const {
      nome,
      email,
      telefone,
      senha,
      sexo,
      endereco,
      nif,
      data_nascimento,
      numero_utente
    } = req.body;

    // Validar
    if (!nome || !email || !telefone || !senha) {
      return res.status(400).json({ 
        message: 'Nome, email, telefone e senha são obrigatórios' 
      });
    }

    // Verificar se email já existe 
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ 
        message: `Email já cadastrado como ${existingEmail.tipo === 'admin' ? 'administrador' : 'utilizador'}` 
      });
    }

    // Verificar se telefone já existe
    const existingPhone = await User.findOne({ where: { telefone } });
    if (existingPhone) {
      return res.status(409).json({ 
        message: `Telefone já cadastrado como ${existingPhone.tipo === 'admin' ? 'administrador' : 'utilizador'}` 
      });
    }

    const rawPassword = String(senha);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Criar o utilizador 
    const novoUtilizador = await User.create({
      nome,
      email,
      telefone,
      senha: hashedPassword,
      tipo: 'user', // Hardcoded - sempre 'user' para segurança
      ativo: true,
      sexo,
      endereco,
      nif,
      data_nascimento,
      numero_utente
    });

    const { senha: _senha, ...utilizadorSemSenha } = novoUtilizador.toJSON();

    return res.status(201).json({ 
      message: 'Utilizador criado com sucesso',
      utilizador: utilizadorSemSenha
    });
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

// Listar 
controller.get_utilizadores = async (req, res) => {
  try {
    const utilizadores = await User.findAll({
      where: { 
        tipo: 'user',
        ativo: true
      },
      attributes: { exclude: ['senha'] },
      order: [['id', 'ASC']]
    });

    return res.status(200).json({ 
      message: 'Utilizadores listados com sucesso',
      count: utilizadores.length,
      utilizadores 
    });
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

// Listar TODOS 
controller.get_todos_utilizadores = async (req, res) => {
  try {
    const todos = await User.findAll({
      attributes: { exclude: ['senha'] },
      order: [['id', 'ASC']]
    });

    return res.status(200).json({ 
      message: 'Todos os utilizadores listados',
      count: todos.length,
      utilizadores: todos 
    });
  } catch (error) {
    console.error('Erro ao listar todos:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

// Obter utilizador por ID
controller.get_utilizador_by_id = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID do utilizador em falta' });
    }

    const utilizador = await User.findOne({
      where: { 
        id,
        tipo: 'user'
      },
      attributes: { exclude: ['senha'] }
    });

    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    return res.status(200).json({ 
      message: 'Utilizador encontrado',
      utilizador 
    });
  } catch (error) {
    console.error('Erro ao buscar utilizador:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

// Atualizar utilizador
controller.atualizar_utilizador = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      telefone,
      senha,
      sexo,
      endereco,
      nif,
      data_nascimento,
      numero_utente,
      ativo
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'ID do utilizador em falta' });
    }

    const utilizador = await User.findOne({
      where: { 
        id,
        tipo: 'user'
      }
    });

    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    // Verificar se o email já existe (se estiver a ser alterado)
    if (email && email !== utilizador.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email já cadastrado' });
      }
    }

    // Verificar se o telefone já existe (se estiver a ser alterado)
    if (telefone && telefone !== utilizador.telefone) {
      const existingPhone = await User.findOne({ where: { telefone } });
      if (existingPhone) {
        return res.status(409).json({ message: 'Telefone já cadastrado' });
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao = {
      nome: nome || utilizador.nome,
      email: email || utilizador.email,
      telefone: telefone || utilizador.telefone,
      sexo: sexo !== undefined ? sexo : utilizador.sexo,
      endereco: endereco !== undefined ? endereco : utilizador.endereco,
      nif: nif !== undefined ? nif : utilizador.nif,
      data_nascimento: data_nascimento !== undefined ? data_nascimento : utilizador.data_nascimento,
      numero_utente: numero_utente !== undefined ? numero_utente : utilizador.numero_utente,
      ativo: ativo !== undefined ? ativo : utilizador.ativo,
      tipo: 'user' // Garantir que o tipo permanece 'user'
    };

    // Se a senha foi fornecida, fazer hash
    if (senha) {
      dadosAtualizacao.senha = await bcrypt.hash(senha, 10);
    }

    await utilizador.update(dadosAtualizacao);

    // Não devolver a senha no response
    const { senha: _senha, ...utilizadorSemSenha } = utilizador.toJSON();

    return res.status(200).json({ 
      message: 'Utilizador atualizado com sucesso',
      utilizador: utilizadorSemSenha
    });
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

// Desativar utilizador (soft delete)
controller.desativar_utilizador = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID do utilizador em falta' });
    }

    const utilizador = await User.findOne({
      where: { 
        id,
        tipo: 'user'
      }
    });

    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    await utilizador.update({ ativo: false });

    return res.status(200).json({ 
      message: 'Utilizador desativado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao desativar utilizador:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

// Apagar utilizador permanentemente
controller.apagar_utilizador = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'ID do utilizador em falta' });
    }

    const utilizador = await User.findOne({
      where: { 
        id,
        tipo: 'user'
      }
    });

    if (!utilizador) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    await utilizador.destroy();

    return res.status(200).json({ 
      message: 'Utilizador apagado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao apagar utilizador:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

// Procurar utilizadores por nome
controller.procurar_utilizadores = async (req, res) => {
  try {
    const { nome } = req.query;

    if (!nome) {
      return res.status(400).json({ message: 'Nome para pesquisa em falta' });
    }

    const utilizadores = await User.findAll({
      where: { 
        tipo: 'user',
        ativo: true,
        nome: {
          [Op.like]: `%${nome}%`
        }
      },
      attributes: { exclude: ['senha'] },
      order: [['nome', 'ASC']]
    });

    return res.status(200).json({ 
      message: 'Pesquisa concluída',
      count: utilizadores.length,
      utilizadores 
    });
  } catch (error) {
    console.error('Erro ao procurar utilizadores:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

module.exports = controller;
