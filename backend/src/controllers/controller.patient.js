const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');

const models = initModels(sequelize);
const { User, Dependente, PatientConsent, Plano, Consulta, Notification } = models;

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseDateOnly(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

function parseHHMM(value) {
  if (!value) return null;
  const s = String(value).trim();
  const m = s.match(/^([0-9]{2}):([0-9]{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23) return null;
  if (mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function isAdmin(req) {
  return String(req.user?.tipo || '').toLowerCase() === 'admin';
}

function isMedico(req) {
  const role = String(req.user?.tipo || '').toLowerCase();
  return role === 'medico' || role === 'médico';
}

async function resolveMedicoNome(id_medico) {
  const mid = parseId(id_medico);
  if (!mid) return null;

  // Prefer: utilizador (tipo='medico')
  try {
    const medicoUser = await User.findOne({
      where: { id: mid, tipo: 'medico', ativo: true },
      attributes: ['nome'],
    });
    if (medicoUser?.nome) return medicoUser.nome;
  } catch {
    // ignore
  }

  // Fallback: instalações antigas podem usar a tabela 'medico'
  try {
    const rows = await sequelize.query('SELECT nome FROM medico WHERE id_medico = :id LIMIT 1', {
      replacements: { id: mid },
      type: sequelize.QueryTypes.SELECT,
    });
    const first = Array.isArray(rows) ? rows[0] : null;
    const nome = first?.nome ? String(first.nome) : null;
    return nome || null;
  } catch {
    return null;
  }
}

async function notifyConsultaRequest({ consulta, patient, requestedAt, reason, dependent, req }) {
  try {
    const targets = await User.findAll({
      where: {
        tipo: { [Op.in]: ['admin', 'medico'] },
        ativo: true,
      },
      attributes: ['id', 'tipo', 'nome', 'email'],
    });

    const payload = {
      kind: 'consulta_request',
      consultaId: consulta?.id_consulta,
      patientId: patient?.id,
      patientName: patient?.nome,
      dependentId: dependent?.id_dependente || consulta?.id_dependente || null,
      dependentName: dependent?.nome || null,
      treatmentPlanId: consulta?.id_tratamento || null,
      requestedAt: requestedAt ? new Date(requestedAt).toISOString() : null,
      reason: reason || null,
    };

    for (const u of targets || []) {
      await Notification.create({
        user_id: u.id,
        type: 'consulta_request',
        title: 'Solicitação de consulta (paciente)',
        body: JSON.stringify(payload),
        scheduled_for: requestedAt ? new Date(requestedAt) : null,
        sent_at: null,
        read_at: null,
        created_at: new Date(),
      });
    }
  } catch (e) {
    // best-effort (não bloquear pedido de consulta)
    console.error('Falha ao criar notificações de consulta_request:', e);
  }
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

exports.get_patient_contact = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseId(id);
    if (!idNum) return res.status(400).json({ message: 'ID inválido' });

    const patient = await User.findOne({
      where: { id: idNum, tipo: 'user' },
      attributes: ['id', 'nome', 'email', 'telefone'],
    });

    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    return res.status(200).json({
      contact: {
        id: patient.id,
        nome: patient.nome,
        email: patient.email,
        telefone: patient.telefone,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao obter contacto do paciente' });
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

exports.get_dependent = async (req, res) => {
  try {
    const { id, id_dependente } = req.params;
    const patientId = parseId(id);
    const depId = parseId(id_dependente);
    if (!patientId || !depId) return res.status(400).json({ message: 'ID inválido' });

    const dependente = await Dependente.findOne({
      where: {
        id_dependente: depId,
        id: patientId,
      },
    });

    if (!dependente) return res.status(404).json({ message: 'Dependente não encontrado' });
    return res.status(200).json({ dependente });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao obter dependente' });
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

exports.list_planos = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseId(id);
    if (!idNum) return res.status(400).json({ message: 'ID inválido' });

    const planos = await Plano.findAll({
      where: { id: idNum },
      order: [
        ['data_inicio', 'DESC'],
        ['id_tratamento', 'DESC'],
      ],
    });

    const dependentIds = Array.from(
      new Set(
        (planos || [])
          .map((p) => p?.dependent_id)
          .filter((did) => did != null)
          .map((did) => Number(did))
          .filter((did) => Number.isFinite(did) && did > 0)
      )
    );

    const dependentNameById = new Map();
    if (dependentIds.length) {
      const deps = await Dependente.findAll({
        where: { id_dependente: { [Op.in]: dependentIds }, id: idNum },
        attributes: ['id_dependente', 'nome'],
      });
      for (const d of deps || []) {
        if (d?.id_dependente != null) dependentNameById.set(String(d.id_dependente), d?.nome || null);
      }
    }

    const planosOut = (planos || []).map((p) => {
      const plain = typeof p?.toJSON === 'function' ? p.toJSON() : p;
      const did = plain?.dependent_id != null ? String(plain.dependent_id) : '';
      return {
        ...plain,
        dependente_nome: did ? dependentNameById.get(did) || null : null,
      };
    });

    return res.status(200).json({ count: planosOut.length, planos: planosOut });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar planos' });
  }
};

exports.get_plano = async (req, res) => {
  try {
    const { id, id_tratamento } = req.params;
    const patientId = parseId(id);
    const planId = parseId(id_tratamento);
    if (!patientId) return res.status(400).json({ message: 'ID inválido' });
    if (!planId) return res.status(400).json({ message: 'id_tratamento inválido' });

    const plano = await Plano.findOne({ where: { id_tratamento: planId, id: patientId } });
    if (!plano) return res.status(404).json({ message: 'Plano não encontrado' });

    let dependente_nome = null;
    if (plano?.dependent_id != null) {
      const dep = await Dependente.findOne({
        where: { id_dependente: plano.dependent_id, id: patientId },
        attributes: ['nome'],
      });
      dependente_nome = dep?.nome || null;
    }

    const dateOnlyFromAny = (v) => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10);
    };

    const baseWhere = { id: patientId };
    if (plano?.dependent_id != null) baseWhere.id_dependente = plano.dependent_id;
    else baseWhere.id_dependente = null;

    let consultas = await Consulta.findAll({
      where: { ...baseWhere, id_tratamento: planId },
      order: [['data_consulta', 'DESC'], ['hora', 'DESC']],
    });

    // Fallback: se não há ligação explícita, usar intervalo de datas do plano (se existir)
    if ((!consultas || consultas.length === 0) && (plano?.data_inicio || plano?.data_fim)) {
      const di = dateOnlyFromAny(plano?.data_inicio);
      const df = dateOnlyFromAny(plano?.data_fim);
      const where = { ...baseWhere };
      if (di && df) where.data_consulta = { [Op.between]: [di, df] };
      else if (di) where.data_consulta = { [Op.gte]: di };
      else if (df) where.data_consulta = { [Op.lte]: df };

      consultas = await Consulta.findAll({
        where,
        order: [['data_consulta', 'DESC'], ['hora', 'DESC']],
      });
    }

    const medicoIds = Array.from(
      new Set(
        (consultas || [])
          .map((c) => c?.id_medico)
          .filter((mid) => mid != null)
          .map((mid) => Number(mid))
          .filter((mid) => Number.isFinite(mid) && mid > 0)
      )
    );

    const medicoNameById = new Map();
    for (const mid of medicoIds) {
      const name = await resolveMedicoNome(mid);
      if (name) medicoNameById.set(String(mid), name);
    }

    const consultasOut = (consultas || []).map((c) => {
      const plain = typeof c?.toJSON === 'function' ? c.toJSON() : c;
      const mid = plain?.id_medico != null ? String(plain.id_medico) : '';
      return {
        ...plain,
        medico_nome: mid ? medicoNameById.get(mid) || null : null,
        dependente_nome,
      };
    });

    const plainPlano = typeof plano?.toJSON === 'function' ? plano.toJSON() : plano;

    return res.status(200).json({
      plano: {
        ...plainPlano,
        dependente_nome,
      },
      consultas: consultasOut,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao obter plano' });
  }
};

exports.download_plano_pdf = async (req, res) => {
  try {
    const { id, id_tratamento } = req.params;
    const patientId = parseId(id);
    const planId = parseId(id_tratamento);
    if (!patientId) return res.status(400).json({ message: 'ID inválido' });
    if (!planId) return res.status(400).json({ message: 'id_tratamento inválido' });

    const plano = await Plano.findOne({ where: { id_tratamento: planId, id: patientId } });
    if (!plano) return res.status(404).json({ message: 'Plano não encontrado' });

    let dependente_nome = null;
    if (plano?.dependent_id != null) {
      const dep = await Dependente.findOne({
        where: { id_dependente: plano.dependent_id, id: patientId },
        attributes: ['nome'],
      });
      dependente_nome = dep?.nome || null;
    }

    const patient = await User.findOne({ where: { id: patientId, tipo: 'user' }, attributes: ['id', 'nome', 'email', 'telefone'] });
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    const toPTDate = (d) => {
      if (!d) return '—';
      const dt = d instanceof Date ? d : new Date(d);
      if (Number.isNaN(dt.getTime())) return '—';
      return dt.toLocaleDateString('pt-PT');
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="plano-tratamento-${planId}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 54 });
    doc.pipe(res);

    doc.fontSize(16).text('Clínica', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text('Plano de Tratamento', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(11).text(`Paciente: ${patient?.nome || ''}`);
    if (dependente_nome) {
      doc.text(`Dependente: ${dependente_nome}`);
    }
    doc.text(`Plano ID: ${plano.id_tratamento}`);
    doc.text(`Início: ${toPTDate(plano.data_inicio)}`);
    doc.text(`Fim: ${toPTDate(plano.data_fim)}`);
    doc.text(`Estado: ${plano.status || '—'}`);
    if (plano?.nome) {
      doc.text(`Nome: ${String(plano.nome)}`);
    }
    doc.moveDown(1);

    doc.fontSize(11).text('Descrição:', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).text(String(plano.descricao || '—'), { align: 'left' });

    doc.moveDown(2);
    doc.fontSize(10).fillColor('#6b7280').text(`Emitido em: ${new Date().toLocaleString('pt-PT')}`);
    doc.end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao descarregar plano' });
  }
};

exports.list_consultas = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseId(id);
    if (!idNum) return res.status(400).json({ message: 'ID inválido' });

    const consultas = await Consulta.findAll({
      where: { id: idNum },
      order: [['data_consulta', 'DESC'], ['hora', 'DESC']],
    });

    // Mapear nome do médico
    const medicoIds = Array.from(
      new Set(
        (consultas || [])
          .map((c) => c?.id_medico)
          .filter((mid) => mid != null)
          .map((mid) => Number(mid))
          .filter((mid) => Number.isFinite(mid) && mid > 0)
      )
    );

    const dependentIds = Array.from(
      new Set(
        (consultas || [])
          .map((c) => c?.id_dependente)
          .filter((did) => did != null)
          .map((did) => Number(did))
          .filter((did) => Number.isFinite(did) && did > 0)
      )
    );

    const medicoNameById = new Map();
    for (const mid of medicoIds) {
      const name = await resolveMedicoNome(mid);
      if (name) medicoNameById.set(String(mid), name);
    }

    const dependentNameById = new Map();
    if (dependentIds.length) {
      const deps = await Dependente.findAll({
        where: { id_dependente: { [Op.in]: dependentIds }, id: idNum },
        attributes: ['id_dependente', 'nome'],
      });
      for (const d of deps || []) {
        if (d?.id_dependente != null) dependentNameById.set(String(d.id_dependente), d?.nome || null);
      }
    }

    const consultasOut = (consultas || []).map((c) => {
      const plain = typeof c?.toJSON === 'function' ? c.toJSON() : c;
      const mid = plain?.id_medico != null ? String(plain.id_medico) : '';
      const did = plain?.id_dependente != null ? String(plain.id_dependente) : '';
      return {
        ...plain,
        medico_nome: mid ? medicoNameById.get(mid) || null : null,
        dependente_nome: did ? dependentNameById.get(did) || null : null,
      };
    });

    return res.status(200).json({ count: consultasOut.length, consultas: consultasOut });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar consultas' });
  }
};

exports.get_consulta = async (req, res) => {
  try {
    const { id, id_consulta } = req.params;
    const patientId = parseId(id);
    const consultaId = parseId(id_consulta);
    if (!patientId) return res.status(400).json({ message: 'ID inválido' });
    if (!consultaId) return res.status(400).json({ message: 'id_consulta inválido' });

    const consulta = await Consulta.findOne({ where: { id_consulta: consultaId, id: patientId } });
    if (!consulta) return res.status(404).json({ message: 'Consulta não encontrada' });

    const medico_nome = await resolveMedicoNome(consulta?.id_medico);

    let dependente_nome = null;
    if (consulta?.id_dependente != null) {
      const dep = await Dependente.findOne({
        where: { id_dependente: consulta.id_dependente, id: patientId },
        attributes: ['nome'],
      });
      dependente_nome = dep?.nome || null;
    }

    const plain = typeof consulta?.toJSON === 'function' ? consulta.toJSON() : consulta;
    return res.status(200).json({
      consulta: {
        ...plain,
        medico_nome,
        dependente_nome,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao obter consulta' });
  }
};

// Pedido de consulta pelo paciente: sempre pendente e apenas com >=48h de antecedência.
exports.request_consulta = async (req, res) => {
  try {
    const { id } = req.params;
    const idNum = parseId(id);
    if (!idNum) return res.status(400).json({ message: 'ID inválido' });

    const patient = await User.findOne({
      where: { id: idNum, tipo: 'user', ativo: true },
      attributes: ['id', 'nome', 'email', 'tipo', 'ativo'],
    });
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    // Apenas paciente pode pedir consulta para si mesmo (admin pode usar /consultas).
    if (!isAdmin(req) && String(req.user?.id) !== String(idNum)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    const { data_consulta, hora, razao_consulta, id_medico, duracao, notas_internas } = req.body || {};
    const idDependenteRaw = req.body?.id_dependente ?? req.body?.dependent_id ?? null;
    const idTratamentoRaw = req.body?.id_tratamento ?? req.body?.treatmentPlanId ?? null;
    const dateOnly = parseDateOnly(data_consulta);
    const hhmm = parseHHMM(hora);
    if (!dateOnly || !hhmm) {
      return res.status(400).json({ message: 'Campos obrigatórios: data_consulta (YYYY-MM-DD) e hora (HH:MM)' });
    }

    // Opcional: pedido para dependente do próprio paciente
    let dependent = null;
    let idDependenteNum = idDependenteRaw == null ? null : parseId(idDependenteRaw);
    if (idDependenteRaw != null && idDependenteNum == null) {
      return res.status(400).json({ message: 'id_dependente inválido' });
    }
    if (idDependenteNum != null) {
      dependent = await Dependente.findOne({
        where: { id_dependente: idDependenteNum, id: idNum, ativo: true },
        attributes: ['id_dependente', 'nome', 'id', 'ativo'],
      });
      if (!dependent) {
        return res.status(400).json({ message: 'Dependente inválido (ou não pertence ao paciente)' });
      }
    }

    // Opcional: associar a um plano de tratamento do paciente (e, se aplicável, do dependente)
    let plano = null;
    let idTratamentoNum = idTratamentoRaw == null ? null : parseId(idTratamentoRaw);
    if (idTratamentoRaw != null && idTratamentoNum == null) {
      return res.status(400).json({ message: 'id_tratamento inválido' });
    }
    if (idTratamentoNum != null) {
      plano = await Plano.findOne({
        where: { id_tratamento: idTratamentoNum, id: idNum },
        attributes: ['id_tratamento', 'id', 'dependent_id'],
      });
      if (!plano) {
        return res.status(400).json({ message: 'Tratamento inválido (ou não pertence ao paciente)' });
      }

      const planDepId = plano?.dependent_id == null ? null : Number(plano.dependent_id);
      const reqDepId = dependent ? Number(dependent.id_dependente) : null;
      if (reqDepId == null && planDepId != null) {
        return res.status(400).json({ message: 'Tratamento selecionado é de um dependente. Selecione o dependente correto.' });
      }
      if (reqDepId != null && planDepId != null && planDepId !== reqDepId) {
        return res.status(400).json({ message: 'Tratamento selecionado não corresponde ao dependente selecionado.' });
      }
      if (reqDepId != null && planDepId == null) {
        return res.status(400).json({ message: 'Tratamento selecionado é do paciente. Selecione "Paciente" ou escolha um tratamento do dependente.' });
      }
    }

    const requestedAt = new Date(`${dateOnly}T${hhmm}:00`);
    if (Number.isNaN(requestedAt.getTime())) {
      return res.status(400).json({ message: 'Data/hora inválida' });
    }

    // regra 48 horas: paciente só pode marcar com >= 48h de antecedência
    const diffHoras = (requestedAt.getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffHoras < 48) {
      return res.status(400).json({ message: 'Os pedidos de consulta devem ser feitos com pelo menos 48h de antecedência' });
    }

    // Opcional: permitir escolher profissional e duração (UI igual ao gestor).
    let medicoIdNum = parseId(id_medico);
    if (id_medico != null && medicoIdNum == null) {
      return res.status(400).json({ message: 'id_medico inválido' });
    }
    if (medicoIdNum != null) {
      const medico = await User.findOne({ where: { id: medicoIdNum, tipo: { [Op.in]: ['medico', 'médico'] }, ativo: true } });
      if (!medico) {
        return res.status(400).json({ message: 'Profissional inválido ou inativo' });
      }
    }

    let duracaoNum = duracao == null ? null : Number(duracao);
    if (duracao != null && !Number.isFinite(duracaoNum)) {
      return res.status(400).json({ message: 'duracao inválida' });
    }
    if (duracaoNum != null) {
      duracaoNum = Math.trunc(duracaoNum);
      if (duracaoNum <= 0 || duracaoNum > 240) {
        return res.status(400).json({ message: 'duracao inválida (1-240)' });
      }
    }

    const safeReason = razao_consulta != null ? String(razao_consulta) : null;
    const safeNotes = notas_internas != null ? String(notas_internas) : null;

    const created = await Consulta.create({
      id_medico: medicoIdNum,
      duracao: duracaoNum,
      tipo_de_marcacao: 'pedido_paciente',
      status: 'Pendente',
      data_consulta: dateOnly,
      id: idNum,
      id_dependente: dependent ? dependent.id_dependente : null,
      id_tratamento: plano ? plano.id_tratamento : null,
      hora: hhmm,
      razao_consulta: safeReason,
      notas_internas: safeNotes,
    });

    await notifyConsultaRequest({
      consulta: created,
      patient,
      requestedAt,
      reason: razao_consulta != null ? String(razao_consulta) : null,
      dependent,
      req,
    });

    return res.status(201).json({ message: 'Pedido de consulta criado', consulta: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao criar pedido de consulta' });
  }
};
