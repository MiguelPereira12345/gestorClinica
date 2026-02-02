module.exports = (sequelize, DataTypes) => {
  const PatientConsent = sequelize.define(
    'PatientConsent',
    {
      id_consent: {
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
      consent_type: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      granted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      granted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'patient_consent',
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['patient_id', 'consent_type'],
        },
      ],
    }
  );

  return PatientConsent;
};
