
require('dotenv').config();
const sequelize = require('./src/models/database');
const { initModels } = require('./src/models/init-models');

const models = initModels(sequelize);
const { Plano, Consulta } = models;

async function testarAssociacao() {
  try {
    console.log('--- A testar associação Plano <-> Consulta ---');
    
    // Buscar um plano qualquer
    const umPlano = await Plano.findOne();
    if (!umPlano) {
      console.log('Nenhum plano encontrado na BD para testar.');
      return;
    }
    console.log(`Plano encontrado: ID ${umPlano.id_tratamento}`);

    // Tentar buscar plano COM consultas
    const planoComConsultas = await Plano.findByPk(umPlano.id_tratamento, {
      include: [{
        model: Consulta,
        as: 'consultas'
      }]
    });

    if (planoComConsultas) {
      console.log('Consulta com include funcionou!');
      console.log('Número de consultas associadas:', planoComConsultas.consultas ? planoComConsultas.consultas.length : 'N/A');
      console.log('Consultas:', JSON.stringify(planoComConsultas.consultas, null, 2));
    } else {
      console.error('Falha ao buscar plano com include.');
    }

  } catch (error) {
    console.error('ERRO durante o teste:', error);
  } finally {
    await sequelize.close();
  }
}

testarAssociacao();
