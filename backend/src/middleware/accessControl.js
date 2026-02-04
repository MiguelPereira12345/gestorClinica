const { requireRole } = require('./authMiddleware');

function requireAdminOrSelf(paramName) {
  return (req, res, next) => {
    const role = req.user?.tipo;
    if (role === 'admin') return next();

    const id = req.user?.id;
    const target = req.params?.[paramName];
    if (id != null && target != null && String(id) === String(target)) return next();

    return res.status(403).json({ message: 'Sem permissão' });
  };
}

function requireStaffOrSelf(paramName) {
  return (req, res, next) => {
    const role = String(req.user?.tipo || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

    if (role === 'admin' || role === 'medico') return next();

    const id = req.user?.id;
    const target = req.params?.[paramName];
    if (id != null && target != null && String(id) === String(target)) return next();

    return res.status(403).json({ message: 'Sem permissão' });
  };
}

module.exports = {
  requireAdminOrSelf,
  requireStaffOrSelf,
  requireRole,
};
