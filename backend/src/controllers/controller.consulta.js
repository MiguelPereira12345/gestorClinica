const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const { Op } = require('sequelize');

const models = initModels(sequelize);
const { Consulta, User } = models;

const controller = {};

function isAdmin(req) {
  return String(req.user?.tipo || '').toLowerCase() === 'admin';
}

function isMedico(req) {
  const role = String(req.user?.tipo || '').toLowerCase();
  return role === 'medico' || role === 'médico';
}

function canViewConsulta(req, consulta) {
  if (isAdmin(req)) return true;
  // Requisito: médico pode ver todas as consultas
  if (isMedico(req)) return true;
  return false;
}

function canManageConsulta(req, consulta) {
  if (isAdmin(req)) return true;
  // Médico só pode alterar consultas atribuídas a si
  if (isMedico(req)) {
    const uid = req.user?.id;
    return uid != null && consulta?.id_medico != null && String(consulta.id_medico) === String(uid);
  }
  return false;
}

// Validar hora no formato HH:MM entre 09:00 e 19:00
const validarHora = (hora) => {
  if (!hora) return false;
  
  const regexHora = /^([0-9]{2}):([0-9]{2})$/;
  if (!regexHora.test(hora)) {
    return false; 
  }

  const [horaNum, minutoNum] = hora.split(':').map(Number);
  
  // Validar hora entre 09:00 e 19:00 
  if (horaNum < 9 || horaNum > 19) {
    return false;
  }
  if (horaNum === 19 && minutoNum !== 0) {
    return false;
  }

  // Validar minutos
  if (minutoNum < 0 || minutoNum > 59) {
    return false;
  }

  return true;
};

//GET CONSULTAS - Últimos 2 meses para evitar crash do pc 
controller.listar_consultas = async (req, res) => {
  try {
    const dataAtual = new Date();
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - 2);

    // incluir também consultas futuras (janela limitada para não sobrecarregar)
    const dataFuturaLimite = new Date();
    dataFuturaLimite.setMonth(dataFuturaLimite.getMonth() + 6);

    const where = {
      data_consulta: {
        [Op.gte]: dataLimite.toISOString().split('T')[0],
        [Op.lte]: dataFuturaLimite.toISOString().split('T')[0]
      }
    };

    const consultas = await Consulta.findAll({
      where,
      order: [['data_consulta', 'DESC'], ['hora', 'DESC']]
    });

    // Mapear nome do médico (utilizador.tipo='medico') para o frontend
    const medicoIds = Array.from(
      new Set(
        (consultas || [])
          .map((c) => c?.id_medico)
          .filter((id) => id != null)
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0)
      )
    );

    let medicoNameById = new Map();
    if (medicoIds.length > 0) {
      const medicos = await User.findAll({
        where: { id: medicoIds, tipo: 'medico', ativo: true },
        attributes: ['id', 'nome'],
      });
      medicoNameById = new Map((medicos || []).map((m) => [String(m.id), m.nome]));
    }

    const consultasOut = (consultas || []).map((c) => {
      const plain = typeof c?.toJSON === 'function' ? c.toJSON() : c;
      const mid = plain?.id_medico != null ? String(plain.id_medico) : '';
      return {
        ...plain,
        medico_nome: mid ? medicoNameById.get(mid) || null : null,
      };
    });

    return res.status(200).json({ 
      message: 'Consultas listadas com sucesso', 
      consultas: consultasOut 
    });
  } catch (error) {
    console.error('Erro ao listar consultas:', error);
    return res.status(500).json({ 
      message: 'Não foi possível listar as consultas'
    });
  }
};

//GET CONSULTA ESPECIFICA
controller.obter_consulta = async (req, res) => {
  try {
    const { id_consulta } = req.params;

    const consulta = await Consulta.findByPk(id_consulta);

    if (!consulta) {
      return res.status(404).json({ 
        message: 'Consulta não encontrada' 
      });
    }

    if (!canViewConsulta(req, consulta)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    let medico_nome = null;
    if (consulta?.id_medico) {
      const medicoUser = await User.findOne({
        where: { id: consulta.id_medico, tipo: 'medico', ativo: true },
        attributes: ['nome'],
      });
      medico_nome = medicoUser ? medicoUser.nome : null;
    }

    const plain = typeof consulta?.toJSON === 'function' ? consulta.toJSON() : consulta;
    return res.status(200).json({ 
      message: 'Consulta encontrada', 
      consulta: {
        ...plain,
        medico_nome,
      }
    });
  } catch (error) {
    console.error('Erro ao obter consulta:', error);
    return res.status(500).json({ 
      message: 'Não foi possível obter a consulta'
    });
  }
};

//DELETE CONSULTA
controller.deletar_consulta = async (req, res) => {
  try {
    const { id_consulta } = req.params;
    const consulta = await Consulta.findByPk(id_consulta);

    if (!consulta) {
      return res.status(404).json({ message: 'Consulta não encontrada' });
    }

    if (!canManageConsulta(req, consulta)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    await consulta.destroy();
    return res.status(200).json({ message: 'Consulta eliminada com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar consulta:', error);
    return res.status(500).json({ message: 'Não foi possível eliminar a consulta' });
  }
};

controller.criar_consulta = async (req, res) => {
  try {
    const {
      id_medico,
      duracao,
      tipo_de_marcacao,
      status,
      data_consulta,
      id,  // ID do paciente (FK para utilizador) - associado por nome e data de nascimento
      hora,
      razao_consulta,
      notas_internas,
    } = req.body;

    // Médico só pode marcar consultas para si próprio.
    const requestedMedicoId = isMedico(req) ? req.user?.id : id_medico;

    // Validação dos campos obrigatórios
    if (!data_consulta || !hora || !id) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: data_consulta, hora, id (paciente)' 
      });
    }

    // Valida se o paciente existe para evitar erro FK (500)
    const paciente = await User.findByPk(id);
    if (!paciente) {
      return res.status(400).json({
        message: 'Paciente não encontrado. Verifica o ID do utilizador (utilizador.id).',
      });
    }

    // Validação - hora entre 09:00 e 19:00 usando função utilitária
    if (!validarHora(hora)) {
      return res.status(400).json({ 
        message: 'Hora inválida. Consultório aberto entre 09:00 e 19:00. Formato: HH:MM' 
      });
    }

    // Validação não permitir consultas no passado
    const dataConsulta = new Date(`${data_consulta}T${hora}`);
    if (Number.isNaN(dataConsulta.getTime())) {
      return res.status(400).json({ 
        message: 'Data ou hora inválida' 
      });
    }

    const agora = new Date();
    if (dataConsulta < agora) {
      return res.status(400).json({ 
        message: 'Não é possível criar consultas no passado' 
      });
    }

    // Valida médico como utilizador (tipo='medico'). Se não existir, guarda NULL para não rebentar FK.
    let safeMedicoId = requestedMedicoId ?? null;
    if (safeMedicoId != null && safeMedicoId !== '') {
      const medicoUser = await User.findOne({
        where: { id: safeMedicoId, tipo: 'medico', ativo: true },
        attributes: ['id'],
      });
      if (!medicoUser) safeMedicoId = null;
    } else {
      safeMedicoId = null;
    }

    const newConsulta = await Consulta.create({
      id_medico: safeMedicoId,
      duracao: duracao || null,
      tipo_de_marcacao: tipo_de_marcacao || null,
      status: status || 'Pendente',
      data_consulta,
      id,
      hora,
      razao_consulta: razao_consulta != null ? String(razao_consulta) : null,
      notas_internas: notas_internas != null ? String(notas_internas) : null,
    });

    return res.status(201).json({ 
      message: 'Consulta criada com sucesso', 
      consulta: newConsulta 
    });
  } catch (error) {
    console.error('Erro ao criar consulta:', error);

    if (error?.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        message: 'Referência inválida (paciente ou médico). Confirma IDs existentes na base de dados.',
      });
    }
    return res.status(500).json({ 
      message: 'Não foi possível criar a consulta'
    });
  }
};

//EDITAR
controller.editar_consulta = async (req, res) => {
  try {
    const { id_consulta } = req.params;
    const {
      id_medico,
      duracao,
      tipo_de_marcacao,
      status,
      data_consulta,
      id,
      hora,
      razao_consulta,
      notas_internas,
    } = req.body;

    // Verifica se a consulta existe
    const consulta = await Consulta.findByPk(id_consulta);
    if (!consulta) {
      return res.status(404).json({ 
        message: 'Consulta não encontrada' 
      });
    }

    if (!canManageConsulta(req, consulta)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // não permitir editar consultas no passado
    if (data_consulta !== undefined || hora !== undefined) {
      const dataParaValidar = data_consulta || consulta.data_consulta;
      const horaParaValidar = hora || consulta.hora;
      
      // Validação - hora entre 09:00 e 19:00 usando função utilitária
      if (horaParaValidar && !validarHora(horaParaValidar)) {
        return res.status(400).json({ 
          message: 'Hora inválida. Consultório aberto entre 09:00 e 19:00. Formato: HH:MM' 
        });
      }
      
      const dataConsulta = new Date(`${dataParaValidar}T${horaParaValidar}`);
      
      if (Number.isNaN(dataConsulta.getTime())) {
        return res.status(400).json({ 
          message: 'Data ou hora inválida' 
        });
      }

      const agora = new Date();
      if (dataConsulta < agora) {
        return res.status(400).json({ 
          message: 'Não é possível editar consultas no passado' 
        });
      }
    }

    // Atualiza os campos fornecidos
    const updatedData = {};
    if (id_medico !== undefined && !isMedico(req)) {
      let safeMedicoId = id_medico;
      if (safeMedicoId != null && safeMedicoId !== '') {
        const medicoUser = await User.findOne({
          where: { id: safeMedicoId, tipo: 'medico', ativo: true },
          attributes: ['id'],
        });
        if (!medicoUser) safeMedicoId = null;
      } else {
        safeMedicoId = null;
      }
      updatedData.id_medico = safeMedicoId;
    }
    if (duracao !== undefined) updatedData.duracao = duracao;
    if (tipo_de_marcacao !== undefined) updatedData.tipo_de_marcacao = tipo_de_marcacao;
    if (status !== undefined) updatedData.status = status;
    if (data_consulta !== undefined) updatedData.data_consulta = data_consulta;
    if (id !== undefined) updatedData.id = id;
    if (hora !== undefined) updatedData.hora = hora;
    if (razao_consulta !== undefined) updatedData.razao_consulta = razao_consulta != null ? String(razao_consulta) : null;
    if (notas_internas !== undefined) updatedData.notas_internas = notas_internas != null ? String(notas_internas) : null;

    await consulta.update(updatedData);

    return res.status(200).json({ 
      message: 'Consulta atualizada com sucesso', 
      consulta 
    });
  } catch (error) {
    console.error('Erro ao editar consulta:', error);
    return res.status(500).json({ 
      message: 'Não foi possível atualizar a consulta'
    });
  }
};

//CANCELAR CONSULTA ATE (até 48h)
controller.cancelar_consulta = async (req, res) => {
  try {
    const { id_consulta } = req.params;

    const consulta = await Consulta.findByPk(id_consulta);
    if (!consulta) {
      return res.status(404).json({ message: 'Consulta não encontrada' });
    }

    if (!canManageConsulta(req, consulta)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    if (!consulta.data_consulta || !consulta.hora) {
      return res.status(400).json({ message: 'Consulta sem data/hora definida' });
    }

    const agendadaPara = new Date(`${consulta.data_consulta}T${consulta.hora}`);
    if (Number.isNaN(agendadaPara.getTime())) {
      return res.status(400).json({ message: 'Data ou hora inválida na consulta' });
    }

    const diffHoras = (agendadaPara.getTime() - Date.now()) / (1000 * 60 * 60);
    if (diffHoras < 48) {
      return res.status(400).json({ message: 'Cancelamento só permitido até 48h antes da consulta' });
    }

    await consulta.update({ status: 'Cancelada' });
    await consulta.reload();

    return res.status(200).json({ message: 'Consulta cancelada com sucesso', consulta });
  } catch (error) {
    console.error('Erro ao cancelar consulta:', error);
    return res.status(500).json({ message: 'Não foi possível cancelar a consulta' });
  }
};

//REMARCAR CONSULTA
controller.remarcar_consulta = async (req, res) => {
  try {
    const { id_consulta } = req.params;
    const { data_consulta, hora } = req.body;

    // Validação dos campos obrigatórios
    if (!data_consulta) {
      return res.status(400).json({ 
        message: 'Campo obrigatório: data da consulta' 
      });
    }

    const consulta = await Consulta.findByPk(id_consulta);
    if (!consulta) {
      return res.status(404).json({ message: 'Consulta não encontrada' });
    }

    if (!canManageConsulta(req, consulta)) {
      return res.status(403).json({ message: 'Sem permissão' });
    }

    // Validar que a consulta não está cancelada
    if (consulta.status === 'Cancelada') {
      return res.status(400).json({ 
        message: 'Não é possível remarcar uma consulta cancelada' 
      });
    }

    // Se hora é fornecida, validar intervalo 09:00-19:00
    if (hora && !validarHora(hora)) {
      return res.status(400).json({ 
        message: 'Hora inválida. Consultório aberto entre 09:00 e 19:00. Formato: HH:MM' 
      });
    }

    // Validar data
    const novaData = new Date(`${data_consulta}T${hora || '00:00'}`);
    if (Number.isNaN(novaData.getTime())) {
      return res.status(400).json({ message: 'Data ou hora inválida' });
    }

    // Lógica: Confirmada se hora se mantém igual à original E não há marcações, caso contrário Pendente
    const horaMantida = hora && hora === consulta.hora;
    const novoStatus = (horaMantida && !consulta.tipo_de_marcacao) ? 'Confirmada' : 'Pendente';
    const mensagem = novoStatus === 'Confirmada'
      ? 'Consulta remarcada com sucesso e confirmada.'
      : 'Consulta remarcada com sucesso. Aguarda aprovação do gestor.';

    await consulta.update({ 
      data_consulta, 
      hora: hora || null,
      status: novoStatus 
    });
    await consulta.reload();

    return res.status(200).json({ 
      message: mensagem, 
      consulta 
    });
  } catch (error) {
    console.error('Erro ao remarcar consulta:', error);
    return res.status(500).json({ 
      message: 'Não foi possível remarcar a consulta'
    });
  }
};

module.exports = controller;
