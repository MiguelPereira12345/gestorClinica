const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const audit = require('./controller.audit');

const models = initModels(sequelize);
const { Declaration, User, Consulta, Dependente } = models;

const PDF_DIR = path.join(__dirname, '..', '..', 'generated');

function ensurePdfDir() {
  if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
}

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toYMD(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function hhmm(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

function buildLocalDateTime(dateOnly, timeOnly) {
  const ymd = toYMD(dateOnly);
  const hm = hhmm(timeOnly);
  if (!ymd || !hm) return null;
  const d = new Date(`${ymd}T${hm}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function buildPdf({ type, patient, payload }) {
  const doc = new PDFDocument({ size: 'A4', margin: 54 });

  doc.fontSize(16).text('Clínica', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).text(`Declaração: ${type}`, { align: 'center' });
  doc.moveDown(1.5);

  const subjectName = payload?.subject_name || patient?.nome || '';
  const responsavelNome = payload?.responsavel_nome || '';
  const isSubjectPatient = !payload?.subject_name || String(payload?.subject_name) === String(patient?.nome || '');

  doc.fontSize(11).text(`Paciente: ${subjectName}`);
  if (!isSubjectPatient && responsavelNome) {
    doc.text(`Responsável: ${responsavelNome}`);
  }
  // Mantém contactos do responsável (utilizador). Para dependentes não existe email/telefone.
  doc.text(`Email: ${patient?.email || ''}`);
  doc.text(`Telefone: ${patient?.telefone || ''}`);
  doc.moveDown(1);

  if (payload?.text) {
    doc.fontSize(11).text(String(payload.text), { align: 'left' });
  } else {
    doc.fontSize(11).text('Declaração emitida pela clínica.', { align: 'left' });
  }

  doc.moveDown(2);
  doc.fontSize(10).text(`Emitido em: ${new Date().toLocaleString('pt-PT')}`);

  return doc;
}

exports.create = async (req, res) => {
  try {
    const { patient_id, type, consulta_id, payload } = req.body || {};

    const patientIdNum = parseId(patient_id);
    if (!patientIdNum) return res.status(400).json({ message: 'patient_id inválido' });
    if (!type) return res.status(400).json({ message: 'type é obrigatório' });

    const patient = await User.findOne({ where: { id: patientIdNum, tipo: 'user' }, attributes: ['id', 'nome', 'email', 'telefone'] });
    if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

    ensurePdfDir();

    const fileName = `declaration-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`;
    const pdfPath = path.join(PDF_DIR, fileName);

    const doc = buildPdf({ type: String(type), patient, payload });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);
    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const created = await Declaration.create({
      patient_id: patientIdNum,
      consulta_id: consulta_id != null ? parseId(consulta_id) : null,
      created_by: req.user?.id || null,
      type: String(type),
      payload_json: payload != null ? JSON.stringify(payload) : null,
      pdf_path: fileName,
      created_at: new Date(),
    });

    await audit._writeAudit({
      req,
      action: 'declaration.create',
      entityType: 'declaration',
      entityId: created.id_declaration,
      metadata: { patient_id: patientIdNum, type: String(type) },
    }).catch(() => {});

    return res.status(201).json({ message: 'Declaração criada', declaration: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao criar declaração' });
  }
};

exports.list = async (req, res) => {
  try {
    const { patientId } = req.query || {};
    const where = {};

    if (req.user?.tipo === 'admin') {
      if (patientId != null && String(patientId).trim() !== '') {
        const idNum = parseId(patientId);
        if (!idNum) return res.status(400).json({ message: 'patientId inválido' });
        where.patient_id = idNum;
      }
    } else {
      where.patient_id = req.user?.id;
    }

    const rows = await Declaration.findAll({ where, order: [['created_at', 'DESC'], ['id_declaration', 'DESC']] });
    return res.status(200).json({ count: rows.length, declarations: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar declarações' });
  }
};

exports.download = async (req, res) => {
  try {
    const idDecl = parseId(req.params.id_declaration);
    if (!idDecl) return res.status(400).json({ message: 'id_declaration inválido' });

    const row = await Declaration.findByPk(idDecl);
    if (!row) return res.status(404).json({ message: 'Declaração não encontrada' });

    if (req.user?.tipo !== 'admin' && String(row.patient_id) !== String(req.user?.id)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    ensurePdfDir();

    const fullPath = path.join(PDF_DIR, row.pdf_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'PDF não encontrado' });

    return res.download(fullPath, `declaracao-${row.id_declaration}.pdf`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao descarregar PDF' });
  }
};

// Download (e cria se necessário) a declaração de presença associada a uma consulta.
// Regras:
//  - paciente só pode descarregar a sua própria consulta (responsável)
//  - só permitido quando a data+hora da consulta já passou
//  - cria 1 registo por consulta (type='presenca') se ainda não existir
exports.downloadPresenceByConsulta = async (req, res) => {
  try {
    const consultaId = parseId(req.params.consulta_id);
    if (!consultaId) return res.status(400).json({ message: 'consulta_id inválido' });

    const consulta = await Consulta.findByPk(consultaId);
    if (!consulta) return res.status(404).json({ message: 'Consulta não encontrada' });

    const role = String(req.user?.tipo || '').toLowerCase();
    const isStaff = role === 'admin' || role === 'medico' || role === 'médico' || role === 'secretaria';
    if (!isStaff && String(consulta.id) !== String(req.user?.id)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    const startAt = buildLocalDateTime(consulta.data_consulta, consulta.hora);
    if (!startAt) return res.status(400).json({ message: 'Consulta sem data/hora válidas' });
    if (Date.now() < startAt.getTime()) {
      return res.status(403).json({ message: 'Declaração disponível apenas após a consulta' });
    }

    let row = await Declaration.findOne({
      where: { consulta_id: consultaId, type: 'presenca' },
      order: [['created_at', 'DESC'], ['id_declaration', 'DESC']],
    });

    ensurePdfDir();
    const hasFile = row?.pdf_path ? fs.existsSync(path.join(PDF_DIR, row.pdf_path)) : false;

    if (!row || !hasFile) {
      const patient = await User.findOne({
        where: { id: consulta.id },
        attributes: ['id', 'nome', 'email', 'telefone'],
      });
      if (!patient) return res.status(404).json({ message: 'Paciente não encontrado' });

      let medicoNome = '';
      if (consulta.id_medico != null) {
        const medico = await User.findOne({ where: { id: consulta.id_medico }, attributes: ['id', 'nome'] });
        medicoNome = medico?.nome || '';
      }

      let subjectName = patient.nome;
      let responsavelNome = '';
      if (consulta.id_dependente != null) {
        const dep = await Dependente.findOne({
          where: { id_dependente: consulta.id_dependente, id: consulta.id },
          attributes: ['id_dependente', 'nome'],
        });
        if (dep?.nome) {
          subjectName = dep.nome;
          responsavelNome = patient.nome;
        }
      }

      const dateStr = toYMD(consulta.data_consulta);
      const timeStr = hhmm(consulta.hora);
      const texto = `Declara-se que o(a) paciente ${subjectName || ''}${responsavelNome ? ` (dependente de ${responsavelNome})` : ''} esteve presente na clínica no dia ${dateStr || ''} às ${timeStr || ''}${medicoNome ? `, para consulta com ${medicoNome}` : ''}.`;

      const payload = {
        subject_name: subjectName,
        responsavel_nome: responsavelNome || null,
        professional_name: medicoNome || null,
        consulta_date: dateStr || null,
        consulta_time: timeStr || null,
        text: texto,
      };

      const fileName = `declaration-presenca-${consultaId}-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`;
      const pdfPath = path.join(PDF_DIR, fileName);

      const doc = buildPdf({ type: 'Presença', patient, payload });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);
      doc.end();

      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      row = await Declaration.create({
        patient_id: patient.id,
        consulta_id: consultaId,
        created_by: req.user?.id || null,
        type: 'presenca',
        payload_json: JSON.stringify(payload),
        pdf_path: fileName,
        created_at: new Date(),
      });

      await audit
        ._writeAudit({
          req,
          action: 'declaration.presenca.create',
          entityType: 'declaration',
          entityId: row.id_declaration,
          metadata: { consulta_id: consultaId, patient_id: patient.id },
        })
        .catch(() => {});
    }

    const fullPath = path.join(PDF_DIR, row.pdf_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'PDF não encontrado' });

    return res.download(fullPath, `declaracao-presenca-consulta-${consultaId}.pdf`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao descarregar declaração de presença' });
  }
};
