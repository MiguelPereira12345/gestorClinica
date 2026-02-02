// src/models/plano.js
module.exports = (sequelize, DataTypes) => {
  const Plano = sequelize.define(
    'PlanoTratamento',
    {
      id_tratamento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      data_inicio: DataTypes.DATE,
      data_fim: DataTypes.DATE,
      descricao: DataTypes.STRING,
      status: DataTypes.STRING,

      dependent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'dependentes',
          key: 'id_dependente',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'utilizador',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    {
      tableName: 'plano_tratamento',
      timestamps: false,
    }
  );

  Plano.associate = (models) => {
    Plano.belongsTo(models.User, {
      foreignKey: 'id',
      as: 'utilizador',
    });

    Plano.belongsTo(models.Dependente, {
      foreignKey: 'dependent_id',
      as: 'dependente',
    });
  };

  return Plano;
};
