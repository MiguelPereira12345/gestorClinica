module.exports = (sequelize, DataTypes) => {
  const MedicalRecord = sequelize.define(
    'MedicalRecord',
    {
      id_medical_record: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'utilizador',
          key: 'id',
        },
      },
      general_history: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      dental_history: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      habits: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      clinical_observations: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'medical_record',
      timestamps: false,
    }
  );

  return MedicalRecord;
};
