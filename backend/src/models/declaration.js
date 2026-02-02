module.exports = (sequelize, DataTypes) => {
  const Declaration = sequelize.define(
    'Declaration',
    {
      id_declaration: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'utilizador',
          key: 'id',
        },
      },
      consulta_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'consulta',
          key: 'id_consulta',
        },
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'utilizador',
          key: 'id',
        },
      },
      type: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      payload_json: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pdf_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'declaration',
      timestamps: false,
    }
  );

  return Declaration;
};
