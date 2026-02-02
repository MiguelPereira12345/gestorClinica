module.exports = (sequelize, DataTypes) => {
  const ClinicalFile = sequelize.define(
    'ClinicalFile',
    {
      id_file: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      patient_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      dependent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'dependentes',
          key: 'id_dependente',
        },
      },
      uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'utilizador',
          key: 'id',
        },
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      mime_type: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      size_bytes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      storage_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      kind: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'clinical_file',
      timestamps: false,
    }
  );

  return ClinicalFile;
};
