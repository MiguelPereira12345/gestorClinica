module.exports = (sequelize, DataTypes) => {
  const DoctorSchedule = sequelize.define(
    'DoctorSchedule',
    {
      id_schedule: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      medico_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'utilizador',
          key: 'id',
        },
      },
      day_of_week: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'doctor_schedule',
      timestamps: false,
    }
  );

  return DoctorSchedule;
};
