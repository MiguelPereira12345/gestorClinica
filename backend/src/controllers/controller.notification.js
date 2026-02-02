const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const audit = require('./controller.audit');

const models = initModels(sequelize);
const { Notification } = models;

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

exports.create = async (req, res) => {
  try {
    const { user_id, type, title, body, scheduled_for } = req.body || {};

    const userIdNum = parseId(user_id);
    if (!userIdNum) return res.status(400).json({ message: 'user_id inválido' });
    if (!type || !title) return res.status(400).json({ message: 'type e title são obrigatórios' });

    const created = await Notification.create({
      user_id: userIdNum,
      type: String(type),
      title: String(title),
      body: body != null ? String(body) : null,
      scheduled_for: scheduled_for ? new Date(scheduled_for) : null,
      sent_at: null,
      read_at: null,
      created_at: new Date(),
    });

    await audit._writeAudit({
      req,
      action: 'notification.create',
      entityType: 'notification',
      entityId: created.id_notification,
      metadata: { user_id: userIdNum, type: String(type) },
    }).catch(() => {});

    return res.status(201).json({ message: 'Notificação criada', notification: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao criar notificação' });
  }
};

exports.list = async (req, res) => {
  try {
    const { userId, unreadOnly } = req.query || {};
    const where = {};

    if (req.user?.tipo === 'admin') {
      // Por defeito, admin vê apenas as suas próprias notificações.
      // Para ver todas: ?all=true, ou filtrar por userId.
      const all = String(req.query?.all || '').toLowerCase() === 'true';

      if (userId != null && String(userId).trim() !== '') {
        const idNum = parseId(userId);
        if (!idNum) return res.status(400).json({ message: 'userId inválido' });
        where.user_id = idNum;
      } else if (!all) {
        where.user_id = req.user?.id;
      }
    } else {
      where.user_id = req.user?.id;
    }

    if (String(unreadOnly) === 'true') {
      where.read_at = null;
    }

    const rows = await Notification.findAll({ where, order: [['created_at', 'DESC'], ['id_notification', 'DESC']] });
    return res.status(200).json({ count: rows.length, notifications: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar notificações' });
  }
};

exports.mark_read = async (req, res) => {
  try {
    const idNotif = parseId(req.params.id_notification);
    if (!idNotif) return res.status(400).json({ message: 'id_notification inválido' });

    const row = await Notification.findByPk(idNotif);
    if (!row) return res.status(404).json({ message: 'Notificação não encontrada' });

    if (req.user?.tipo !== 'admin' && String(row.user_id) !== String(req.user?.id)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    await row.update({ read_at: new Date() });

    await audit._writeAudit({
      req,
      action: 'notification.read',
      entityType: 'notification',
      entityId: idNotif,
      metadata: { user_id: row.user_id },
    }).catch(() => {});

    return res.status(200).json({ message: 'Notificação marcada como lida', notification: row });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao marcar notificação' });
  }
};
