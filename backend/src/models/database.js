require('dotenv').config();
const { Sequelize } = require('sequelize');

const nodeEnv = process.env.NODE_ENV || 'development';
const dialect = process.env.DB_DIALECT || 'postgres';
const port = process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : undefined;

const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';
const dialectOptions = sslEnabled
  ? {
      ssl: {
        require: true,
        rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true',
      },
    }
  : undefined;

const sequelize = process.env.DB_URL
  ? new Sequelize(process.env.DB_URL, {
      dialect,
      logging: false,
      dialectOptions,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port,
      dialect,
      logging: false,
      dialectOptions,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });

module.exports = sequelize;