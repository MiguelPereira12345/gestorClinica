const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const { Op } = require('sequelize');

const models = initModels(sequelize);
const { DoctorSchedule, Holiday, Consulta } = models;

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseDateOnly(value) {
  const s = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

exports.list_doctor_schedules = async (req, res) => {
  try {
    const { medicoId } = req.query || {};
    const where = {};
    if (medicoId != null && String(medicoId).trim() !== '') {
      const idNum = parseId(medicoId);
      if (!idNum) return res.status(400).json({ message: 'medicoId inválido' });
      where.medico_id = idNum;
    }

    const rows = await DoctorSchedule.findAll({ where, order: [['medico_id', 'ASC'], ['day_of_week', 'ASC'], ['start_time', 'ASC']] });
    return res.status(200).json({ count: rows.length, schedules: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar horários' });
  }
};

exports.create_doctor_schedule = async (req, res) => {
  try {
    const { medico_id, day_of_week, start_time, end_time, active } = req.body || {};

    const medicoIdNum = parseId(medico_id);
    if (!medicoIdNum) return res.status(400).json({ message: 'medico_id inválido' });

    const dow = parseId(day_of_week);
    if (dow == null || dow < 0 || dow > 6) return res.status(400).json({ message: 'day_of_week inválido (0-6)' });

    if (!start_time || !end_time) return res.status(400).json({ message: 'start_time e end_time são obrigatórios' });

    const created = await DoctorSchedule.create({
      medico_id: medicoIdNum,
      day_of_week: dow,
      start_time,
      end_time,
      active: typeof active === 'boolean' ? active : true,
    });

    return res.status(201).json({ message: 'Horário criado', schedule: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao criar horário' });
  }
};

exports.delete_doctor_schedule = async (req, res) => {
  try {
    const idSchedule = parseId(req.params.id_schedule);
    if (!idSchedule) return res.status(400).json({ message: 'id_schedule inválido' });

    const row = await DoctorSchedule.findByPk(idSchedule);
    if (!row) return res.status(404).json({ message: 'Horário não encontrado' });

    await row.destroy();
    return res.status(200).json({ message: 'Horário eliminado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao eliminar horário' });
  }
};

exports.list_holidays = async (req, res) => {
  try {
    const rows = await Holiday.findAll({ order: [['date', 'ASC']] });
    return res.status(200).json({ count: rows.length, holidays: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar feriados' });
  }
};

exports.upsert_holiday = async (req, res) => {
  try {
    const { date, description, is_closed } = req.body || {};
    const d = parseDateOnly(date);
    if (!d) return res.status(400).json({ message: 'date inválida (YYYY-MM-DD)' });

    const existing = await Holiday.findOne({ where: { date: d } });
    if (existing) {
      await existing.update({
        description: description != null ? String(description) : existing.description,
        is_closed: typeof is_closed === 'boolean' ? is_closed : existing.is_closed,
      });
      return res.status(200).json({ message: 'Feriado atualizado', holiday: existing });
    }

    const created = await Holiday.create({
      date: d,
      description: description != null ? String(description) : null,
      is_closed: typeof is_closed === 'boolean' ? is_closed : true,
    });

    return res.status(201).json({ message: 'Feriado criado', holiday: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao guardar feriado' });
  }
};

exports.month_occupancy = async (req, res) => {
  try {
    const { year, month, medicoId } = req.query || {};
    const y = parseId(year);
    const m = parseId(month);
    if (!y || !m || m < 1 || m > 12) return res.status(400).json({ message: 'year/month inválidos' });

    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 1));

    const where = {
      data_consulta: {
        [Op.gte]: from.toISOString().slice(0, 10),
        [Op.lt]: to.toISOString().slice(0, 10),
      },
    };

    if (medicoId != null && String(medicoId).trim() !== '') {
      const idNum = parseId(medicoId);
      if (!idNum) return res.status(400).json({ message: 'medicoId inválido' });
      where.id_medico = idNum;
    }

    const inMonth = await Consulta.findAll({
      where,
      order: [['data_consulta', 'ASC'], ['hora', 'ASC']],
      attributes: ['data_consulta'],
    });

    const byDate = new Map();
    for (const c of inMonth) {
      const key = String(c.data_consulta);
      byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    const occupancy = Array.from(byDate.entries()).map(([dateKey, count]) => ({ date: dateKey, count }));
    return res.status(200).json({ month: m, year: y, occupancy });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao calcular ocupação' });
  }
};
