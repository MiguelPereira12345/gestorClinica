const { DataTypes } = require("sequelize");

function initModels(sequelize) {
  const User = require("./User")(sequelize, DataTypes);
  const Plano = require("./plano")(sequelize, DataTypes);
  const Dependente = require("./dependente")(sequelize, DataTypes);
  const Consulta = require("./consulta")(sequelize, DataTypes);

  return {
    User,
    Plano,
    Dependente,
    Consulta,
  };
}

module.exports = { initModels };
