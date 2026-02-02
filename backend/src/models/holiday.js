module.exports = (sequelize, DataTypes) => {
  const Holiday = sequelize.define(
    'Holiday',
    {
      id_holiday: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
      is_closed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'holiday',
      timestamps: false,
    }
  );

  return Holiday;
};
