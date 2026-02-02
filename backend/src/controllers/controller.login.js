const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');

const models = initModels(sequelize);
const { User } = models;

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    // procura user admin e ativo
    const user = await User.findOne({
      where: {
        email,
        tipo: "admin",
        ativo: true,
      },
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Credenciais inválidas ou sem permissão" });
    }

    // suporte para senhas guardadas em texto simples (varchar) ou hash bcrypt
    let ok = false;
    if (user.senha && /^\$2[aby]\$/.test(user.senha)) {
      ok = await bcrypt.compare(senha, user.senha);
    } else {
      ok = user.senha === senha;
    }

    if (!ok) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Configuração em falta: JWT_SECRET' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        nome: user.nome,
        tipo: user.tipo,
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no login" });
  }
};
