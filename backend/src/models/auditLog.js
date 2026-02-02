module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id_audit: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      actor_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'utilizador',
          key: 'id',
        },
      },
      action: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      entity_type: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.STRING(120),
        allowNull: true,
      },
      metadata_json: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ip: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'audit_log',
      timestamps: false,
    }
  );

  return AuditLog;
};
