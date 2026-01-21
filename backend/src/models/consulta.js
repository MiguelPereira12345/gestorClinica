// src/models/consulta.js
module.exports = (sequelize, DataTypes) => {
  const Consulta = sequelize.define(
    'Consulta',
    {
      id_consulta: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_medico: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'medico',
          key: 'id_medico'
        }
      },
      duracao: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      tipo_de_marcacao: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      data_consulta: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'utilizador',
          key: 'id'
        }
      },
      hora: {
        type: DataTypes.TIME,
        allowNull: false,
      }
    },
    {
      tableName: 'consulta',
      timestamps: false,
    }
  );

  Consulta.associate = (models) => {
    Consulta.belongsTo(models.User, {
      foreignKey: 'id',
      as: 'utilizador',
    });
    // Se tiveres modelo Medico, adiciona:
    // Consulta.belongsTo(models.Medico, {
    //   foreignKey: 'id_medico',
    //   as: 'medico',
    // });
  };

  return Consulta;
};
