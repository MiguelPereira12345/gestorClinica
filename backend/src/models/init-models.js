const { DataTypes } = require("sequelize");

function initModels(sequelize) {
  const User = require("./User")(sequelize, DataTypes);
  const Plano = require("./plano")(sequelize, DataTypes);
  const Dependente = require("./dependente")(sequelize, DataTypes);
  const Consulta = require("./consulta")(sequelize, DataTypes);
  const HistoricoMedico = require("./historicoMedico")(sequelize, DataTypes);
  const RefreshToken = require("./refreshToken")(sequelize, DataTypes);
  const PatientConsent = require("./patientConsent")(sequelize, DataTypes);
  const MedicalRecord = require("./medicalRecord")(sequelize, DataTypes);
  const DoctorSchedule = require("./doctorSchedule")(sequelize, DataTypes);
  const Holiday = require("./holiday")(sequelize, DataTypes);
  const ClinicalFile = require("./clinicalFile")(sequelize, DataTypes);
  const Notification = require("./notification")(sequelize, DataTypes);
  const Declaration = require("./declaration")(sequelize, DataTypes);
  const AuditLog = require("./auditLog")(sequelize, DataTypes);

  const models = {
    User,
    Plano,
    Dependente,
    Consulta,
    HistoricoMedico,
    RefreshToken,
    PatientConsent,
    MedicalRecord,
    DoctorSchedule,
    Holiday,
    ClinicalFile,
    Notification,
    Declaration,
    AuditLog,
  };

  Object.keys(models).forEach((modelName) => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  return models;
}

module.exports = { initModels };
