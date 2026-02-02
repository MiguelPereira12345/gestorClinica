const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');

const models = initModels(sequelize);
const { User, Dependente, PatientConsent } = models;

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

exports.get_patient_profile = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseId(id);
    if (!idNum) return res.status(400).json({ message: 'ID inválido' });

    const patient = await User.findOne({
      where: { id: idNum, tipo: 'user' },
      attributes: { exclude: ['senha'] },
    });

    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    return res.status(200).json({ paciente: patient });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao obter paciente' });
  }
};

exports.list_dependents = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseId(id);
    if (!idNum) return res.status(400).json({ message: 'ID inválido' });

    const dependentes = await Dependente.findAll({
      where: { id: idNum },
      order: [['id_dependente', 'ASC']],
    });

    return res.status(200).json({ count: dependentes.length, dependentes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar dependentes' });
  }
};

exports.get_consents = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseId(id);
    if (!idNum) return res.status(400).json({ message: 'ID inválido' });

    const rows = await PatientConsent.findAll({
      where: { patient_id: idNum },
      order: [['consent_type', 'ASC']],
    });

    return res.status(200).json({ count: rows.length, consents: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao obter consentimentos' });
  }
};

exports.upsert_consent = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseId(id);
    if (!idNum) return res.status(400).json({ message: 'ID inválido' });

    const { consent_type, granted, notes } = req.body || {};
    if (!consent_type) return res.status(400).json({ message: 'consent_type é obrigatório' });

    const patient = await User.findOne({ where: { id: idNum, tipo: 'user' } });
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    const normalizedType = String(consent_type).trim();
    const isGranted = Boolean(granted);

    const existing = await PatientConsent.findOne({
      where: { patient_id: idNum, consent_type: normalizedType },
    });

    if (existing) {
      await existing.update({
        granted: isGranted,
        granted_at: isGranted ? new Date() : existing.granted_at,
        revoked_at: isGranted ? null : new Date(),
        notes: notes != null ? String(notes) : existing.notes,
      });
      return res.status(200).json({ message: 'Consentimento atualizado', consent: existing });
    }

    const created = await PatientConsent.create({
      patient_id: idNum,
      consent_type: normalizedType,
      granted: isGranted,
      granted_at: isGranted ? new Date() : null,
      revoked_at: isGranted ? null : new Date(),
      notes: notes != null ? String(notes) : null,
    });

    return res.status(201).json({ message: 'Consentimento criado', consent: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao guardar consentimento' });
  }
};
