const jwt = require('jsonwebtoken');

function getBearerToken(req) {
  const header = req.headers?.authorization;
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (!token) return null;
  if (String(type).toLowerCase() !== 'bearer') return null;
  return token;
}

function verificarToken(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: 'Configuração em falta: JWT_SECRET' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido ou expirado' });
    }

    req.user = decoded;
    next();
  });
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const normalizeRole = (value) =>
      String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

    const role = normalizeRole(req.user?.tipo);
    const allowed = allowedRoles.map(normalizeRole);

    if (!role || !allowed.includes(role)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }
    next();
  };
}

module.exports = {
  verificarToken,
  requireRole,
};
