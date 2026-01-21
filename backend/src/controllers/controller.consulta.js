const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');

const models = initModels(sequelize);
const { Consulta } = models;

const controller = {};

controller.listar_consultas = async (req, res) => {
  try {
    const consultas = await Consulta.findAll({
      order: [['data_consulta', 'DESC'], ['hora', 'DESC']]
    });

    return res.status(200).json({ 
      message: 'Consultas listadas com sucesso', 
      consultas 
    });
  } catch (error) {
    console.error('Erro ao listar consultas:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

controller.obter_consulta = async (req, res) => {
  try {
    const { id_consulta } = req.params;

    const consulta = await Consulta.findByPk(id_consulta);

    if (!consulta) {
      return res.status(404).json({ 
        message: 'Consulta não encontrada' 
      });
    }

    return res.status(200).json({ 
      message: 'Consulta encontrada', 
      consulta 
    });
  } catch (error) {
    console.error('Erro ao obter consulta:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
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
      id,
      hora,
    } = req.body;

    // Validação dos campos obrigatórios
    if (!data_consulta || !hora) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios: data_consulta, hora' 
      });
    }

    const newConsulta = await Consulta.create({
      id_medico: id_medico || null,
      duracao: duracao || null,
      tipo_de_marcacao: tipo_de_marcacao || null,
      status: status || 'Pendente',
      data_consulta,
      id: id || null,
      hora,
    });

    return res.status(201).json({ 
      message: 'Consulta criada com sucesso', 
      consulta: newConsulta 
    });
  } catch (error) {
    console.error('Erro ao criar consulta:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

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
    } = req.body;

    // Verifica se a consulta existe
    const consulta = await Consulta.findByPk(id_consulta);
    if (!consulta) {
      return res.status(404).json({ 
        message: 'Consulta não encontrada' 
      });
    }

    // Atualiza os campos fornecidos
    const updatedData = {};
    if (id_medico !== undefined) updatedData.id_medico = id_medico;
    if (duracao !== undefined) updatedData.duracao = duracao;
    if (tipo_de_marcacao !== undefined) updatedData.tipo_de_marcacao = tipo_de_marcacao;
    if (status !== undefined) updatedData.status = status;
    if (data_consulta !== undefined) updatedData.data_consulta = data_consulta;
    if (id !== undefined) updatedData.id = id;
    if (hora !== undefined) updatedData.hora = hora;

    await consulta.update(updatedData);

    return res.status(200).json({ 
      message: 'Consulta atualizada com sucesso', 
      consulta 
    });
  } catch (error) {
    console.error('Erro ao editar consulta:', error);
    return res.status(500).json({ 
      message: 'Erro do servidor',
      error: error.message
    });
  }
};

module.exports = controller;
