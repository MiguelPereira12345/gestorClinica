const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');

const models = initModels(sequelize);
const { User, MedicalRecord } = models;

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

exports.get_by_patient = async (req, res) => {
  try {
    const patientId = parseId(req.params.patientId);
    if (!patientId) return res.status(400).json({ message: 'patientId inválido' });

    const patient = await User.findOne({ where: { id: patientId, tipo: 'user' }, attributes: ['id'] });
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    const record = await MedicalRecord.findOne({ where: { patient_id: patientId } });
    if (!record) return res.status(404).json({ message: 'Registo clínico não encontrado' });

    return res.status(200).json({ record });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao obter registo clínico' });
  }
};

exports.upsert_by_patient = async (req, res) => {
  try {
    const patientId = parseId(req.params.patientId);
    if (!patientId) return res.status(400).json({ message: 'patientId inválido' });

    const patient = await User.findOne({ where: { id: patientId, tipo: 'user' }, attributes: ['id'] });
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    const {
      general_history,
      dental_history,
      habits,
      clinical_observations,
    } = req.body || {};

    const existing = await MedicalRecord.findOne({ where: { patient_id: patientId } });

    if (existing) {
      await existing.update({
        general_history: general_history != null ? String(general_history) : existing.general_history,
        dental_history: dental_history != null ? String(dental_history) : existing.dental_history,
        habits: habits != null ? String(habits) : existing.habits,
        clinical_observations: clinical_observations != null ? String(clinical_observations) : existing.clinical_observations,
        updated_at: new Date(),
      });
      return res.status(200).json({ message: 'Registo clínico atualizado', record: existing });
    }

    const created = await MedicalRecord.create({
      patient_id: patientId,
      general_history: general_history != null ? String(general_history) : null,
      dental_history: dental_history != null ? String(dental_history) : null,
      habits: habits != null ? String(habits) : null,
      clinical_observations: clinical_observations != null ? String(clinical_observations) : null,
      updated_at: new Date(),
    });

    return res.status(201).json({ message: 'Registo clínico criado', record: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao guardar registo clínico' });
  }
};
