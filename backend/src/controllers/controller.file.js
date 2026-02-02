const fs = require('fs');
const path = require('path');

const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const audit = require('./controller.audit');

const models = initModels(sequelize);
const { ClinicalFile, Consulta } = models;

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeRole(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

async function canAccessFile(req, fileRow) {
  if (!req.user) return false;

  const role = normalizeRole(req.user.tipo);
  if (role === 'admin') return true;
  if (role === 'medico') return true;

  // pacientes (ou instalações antigas que usem 'user') só podem aceder aos seus
  if (role === 'paciente' || role === 'user') {
    return fileRow.patient_id != null && String(fileRow.patient_id) === String(req.user.id);
  }

  return false;
}

exports.upload = async (req, res) => {
  try {
    const role = normalizeRole(req.user?.tipo);
    if (role !== 'admin' && role !== 'medico') {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // multer middleware must set req.file
    if (!req.file) {
      return res.status(400).json({ message: 'Ficheiro em falta' });
    }

    ensureUploadsDir();

    const consultaId = req.body?.consulta_id != null ? parseId(req.body.consulta_id) : null;
    let patientId = req.body?.patient_id != null ? parseId(req.body.patient_id) : null;
    const kind = req.body?.kind != null ? String(req.body.kind) : null;

    // Se vier consulta_id, inferir patient_id a partir da consulta
    let consultaRow = null;
    if (consultaId) {
      consultaRow = await Consulta.findByPk(consultaId);
      if (!consultaRow) {
        return res.status(400).json({ message: 'consulta_id inválido' });
      }
      if (patientId == null && consultaRow.id != null) {
        patientId = parseId(consultaRow.id);
      }
    }

    const storedName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${req.file.originalname}`;
    const finalPath = path.join(UPLOADS_DIR, storedName);

    fs.renameSync(req.file.path, finalPath);

    const created = await ClinicalFile.create({
      patient_id: patientId,
      consulta_id: consultaId,
      uploaded_by: req.user?.id || null,
      file_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
      storage_path: storedName,
      kind,
      created_at: new Date(),
    });

    await audit._writeAudit({
      req,
      action: 'file.upload',
      entityType: 'clinical_file',
      entityId: created.id_file,
      metadata: { patient_id: patientId, consulta_id: consultaId, kind, file_name: req.file.originalname },
    }).catch(() => {});

    return res.status(201).json({ message: 'Upload efetuado', file: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro no upload' });
  }
};

exports.list = async (req, res) => {
  try {
    const { patientId, consultaId } = req.query || {};
    const where = {};

    const role = normalizeRole(req.user?.tipo);

    // Filtrar por consulta
    if (consultaId != null && String(consultaId).trim() !== '') {
      const cIdNum = parseId(consultaId);
      if (!cIdNum) return res.status(400).json({ message: 'consultaId inválido' });

      const consulta = await Consulta.findByPk(cIdNum);
      if (!consulta) return res.status(404).json({ message: 'Consulta não encontrada' });

      where.consulta_id = cIdNum;

      // Paciente só pode ver anexos das suas consultas
      if (role !== 'admin' && role !== 'medico') {
        if (String(req.user?.id) !== String(consulta?.id)) {
          return res.status(403).json({ message: 'Sem permissão' });
        }
      }

      // ajuda a manter consistência (opcional): também filtra pelo patient_id da consulta
      if (consulta?.id != null) {
        where.patient_id = parseId(consulta.id);
      }

    } else if (patientId != null && String(patientId).trim() !== '') {
      const idNum = parseId(patientId);
      if (!idNum) return res.status(400).json({ message: 'patientId inválido' });
      where.patient_id = idNum;

      if (role !== 'admin' && role !== 'medico' && String(req.user?.id) !== String(idNum)) {
        return res.status(403).json({ message: 'Sem permissão' });
      }
    } else if (role !== 'admin' && role !== 'medico') {
      // utilizador não-admin não-medico sem filtro só pode ver os seus
      where.patient_id = req.user?.id;
    }

    const rows = await ClinicalFile.findAll({ where, order: [['created_at', 'DESC'], ['id_file', 'DESC']] });
    return res.status(200).json({ count: rows.length, files: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao listar ficheiros' });
  }
};

exports.download = async (req, res) => {
  try {
    const idFile = parseId(req.params.id_file);
    if (!idFile) return res.status(400).json({ message: 'id_file inválido' });

    const row = await ClinicalFile.findByPk(idFile);
    if (!row) return res.status(404).json({ message: 'Ficheiro não encontrado' });

    const ok = await canAccessFile(req, row);
    if (!ok) return res.status(403).json({ message: 'Sem permissão' });

    ensureUploadsDir();

    const fullPath = path.join(UPLOADS_DIR, row.storage_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Ficheiro não existe no storage' });
    }

    return res.download(fullPath, row.file_name);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao fazer download' });
  }
};

exports.remove = async (req, res) => {
  try {
    const idFile = parseId(req.params.id_file);
    if (!idFile) return res.status(400).json({ message: 'id_file inválido' });

    const row = await ClinicalFile.findByPk(idFile);
    if (!row) return res.status(404).json({ message: 'Ficheiro não encontrado' });

    if (req.user?.tipo !== 'admin') {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    ensureUploadsDir();

    const fullPath = path.join(UPLOADS_DIR, row.storage_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        // ignore
      }
    }

    await row.destroy();

    await audit._writeAudit({
      req,
      action: 'file.delete',
      entityType: 'clinical_file',
      entityId: idFile,
      metadata: { storage_path: row.storage_path, file_name: row.file_name },
    }).catch(() => {});

    return res.status(200).json({ message: 'Ficheiro eliminado' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erro ao eliminar ficheiro' });
  }
};
