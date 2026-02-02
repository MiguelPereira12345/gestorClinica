const sequelize = require('../models/database');
const { initModels } = require('../models/init-models');
const { DataTypes } = require('sequelize');

const models = initModels(sequelize);
const { Plano, Dependente } = models;

const controller = {};

//GET PLANO
controller.listar_planos = async (req, res) => {
  try {
    const { id } = req.query;

    //ID Validação
    const whereClause = {};
    if (id !== undefined) {
      const idNum = Number(id);
      if (Number.isNaN(idNum)) {
        return res.status(400).json({ message: 'ID inválido' });
      }
      whereClause.id = idNum;
    }

    //ordenar por datas e id
    const planos = await Plano.findAll({
      where: whereClause,
      order: [
        ['data_inicio', 'DESC'],
        ['id_tratamento', 'DESC'],
      ],
    });

    return res.status(200).json({
      message: 'Planos listados com sucesso',
      count: planos.length,
      planos,
    });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    return res.status(500).json({ message: 'Erro do servidor', error: error.message });
  }
};

//GET PLANO ESPECIFICO
controller.obter_plano = async (req, res) => {
  try {
    const { id_tratamento } = req.params;

    if (!id_tratamento) {
      return res.status(400).json({ message: 'ID do plano em falta' });
    }

    const planoId = Number(id_tratamento);
    if (Number.isNaN(planoId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const plano = await Plano.findByPk(planoId);

    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    return res.status(200).json({ message: 'Plano encontrado', plano });
  } catch (error) {
    console.error('Erro ao obter plano:', error);
    return res.status(500).json({ message: 'Erro do servidor', error: error.message });
  }
};

//PLANO POST
controller.criar_plano = async (req, res) => {
  try {
    const { id, data_inicio, data_fim, descricao, status, dependent_id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Campo id (FK para utilizador) em falta' });
    }

    let safeDependentId = null;
    if (dependent_id != null && String(dependent_id).trim() !== '') {
      const depIdNum = Number(dependent_id);
      if (Number.isNaN(depIdNum) || depIdNum <= 0) {
        return res.status(400).json({ message: 'dependent_id inválido' });
      }
      const dep = await Dependente.findOne({ where: { id_dependente: depIdNum, id } });
      if (!dep) {
        return res.status(400).json({ message: 'Dependente inválido (ou não pertence ao paciente)' });
      }
      safeDependentId = depIdNum;
    }

    const newPlano = await Plano.create({
      id,
      dependent_id: safeDependentId,
      data_inicio: data_inicio || null,
      data_fim: data_fim || null,
      descricao: descricao || null,
      status: status || null,
    });

    return res.status(201).json({ message: 'Plano criado com sucesso', plano: newPlano });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    return res.status(500).json({ message: 'Erro do servidor' });
  }
};

//PATCH/PUT PLANO
controller.editar_plano = async (req, res) => {
  try {
    const { id_tratamento } = req.params;

    if (!id_tratamento) {
      return res.status(400).json({ message: 'ID do plano em falta' });
    }

    const planoId = Number(id_tratamento);
    if (Number.isNaN(planoId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const plano = await Plano.findByPk(planoId);
    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    const { id, data_inicio, data_fim, descricao, status, dependent_id } = req.body;

    const updatedData = {};
    if (id !== undefined) updatedData.id = id;
    if (dependent_id !== undefined) {
      let safeDependentId = null;
      if (dependent_id != null && String(dependent_id).trim() !== '') {
        const depIdNum = Number(dependent_id);
        if (Number.isNaN(depIdNum) || depIdNum <= 0) {
          return res.status(400).json({ message: 'dependent_id inválido' });
        }
        const patientIdForDep = updatedData.id !== undefined ? updatedData.id : plano.id;
        const dep = await Dependente.findOne({ where: { id_dependente: depIdNum, id: patientIdForDep } });
        if (!dep) {
          return res.status(400).json({ message: 'Dependente inválido (ou não pertence ao paciente)' });
        }
        safeDependentId = depIdNum;
      }
      updatedData.dependent_id = safeDependentId;
    }
    if (data_inicio !== undefined) updatedData.data_inicio = data_inicio;
    if (data_fim !== undefined) updatedData.data_fim = data_fim;
    if (descricao !== undefined) updatedData.descricao = descricao;
    if (status !== undefined) updatedData.status = status;

    await plano.update(updatedData);

    return res.status(200).json({ message: 'Plano atualizado com sucesso', plano });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    return res.status(500).json({ message: 'Erro do servidor', error: error.message });
  }
};

// DELETE plano
controller.apagar_plano = async (req, res) => {
  try {
    const { id_tratamento } = req.params;

    if (!id_tratamento) {
      return res.status(400).json({ message: 'ID do plano em falta' });
    }

    const planoId = Number(id_tratamento);
    if (Number.isNaN(planoId)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const plano = await Plano.findByPk(planoId);
    if (!plano) {
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    await plano.destroy();
    return res.status(200).json({ message: 'Plano eliminado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar plano:', error);
    return res.status(500).json({ message: 'Erro do servidor', error: error.message });
  }
};

module.exports = controller;
