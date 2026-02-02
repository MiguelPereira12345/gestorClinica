// src/models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      telefone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      tipo: {
        type: DataTypes.ENUM('admin', 'secretaria', 'medico', 'user'),
        allowNull: false,
        defaultValue: 'user',
      },
      ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      data_inscricao: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      senha: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sexo: DataTypes.STRING,
      endereco: DataTypes.STRING,
      nif: DataTypes.STRING,
      data_nascimento: DataTypes.DATE,
      numero_utente: DataTypes.STRING,
    },
    {
      tableName: 'utilizador',
      timestamps: false,
    }
  );

  return User;
};
