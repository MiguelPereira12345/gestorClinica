const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');

const models = initModels(sequelize);
const { AuditLog } = models;

function safeJsonStringify(value) {
  try {
    return value == null ? null : JSON.stringify(value);
  } catch {
    return null;
  }
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim();
  return req.ip || null;
}

async function writeAudit({ req, action, entityType, entityId, metadata }) {
  await AuditLog.create({
    actor_user_id: req.user?.id || null,
    action,
    entity_type: entityType,
    entity_id: entityId != null ? String(entityId) : null,
    metadata_json: safeJsonStringify(metadata),
    ip: clientIp(req),
    created_at: new Date(),
  });
}

exports._writeAudit = writeAudit;

exports.list = async (req, res) => {
  try {
    const { actor, entity_type, limit } = req.query || {};
    const where = {};

    if (actor != null && String(actor).trim() !== '') where.actor_user_id = Number(actor);
    if (entity_type != null && String(entity_type).trim() !== '') where.entity_type = String(entity_type);

    const take = Math.min(Math.max(Number(limit) || 200, 1), 1000);

    const rows = await AuditLog.findAll({
      where,
      order: [['created_at', 'DESC'], ['id_audit', 'DESC']],
      limit: take,
    });

    return res.status(200).json({ count: rows.length, logs: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar auditoria' });
  }
};
