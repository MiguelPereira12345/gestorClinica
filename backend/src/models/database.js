require('dotenv').config();
const { Sequelize } = require('sequelize');

const nodeEnv = process.env.NODE_ENV || 'development';
const dialect = process.env.DB_DIALECT || 'postgres';
const port = process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT, 10) : undefined;

// Render (e outros PaaS) costumam expor a connection string como DATABASE_URL.
const databaseUrl = process.env.DATABASE_URL || process.env.DB_URL;

const sslExplicit = process.env.DB_SSL != null && String(process.env.DB_SSL).trim() !== '';
const sslEnabled = sslExplicit
  ? String(process.env.DB_SSL || '').toLowerCase() === 'true'
  : Boolean(databaseUrl) && nodeEnv === 'production';

const rejectUnauthorizedExplicit =
  process.env.DB_SSL_REJECT_UNAUTHORIZED != null &&
  String(process.env.DB_SSL_REJECT_UNAUTHORIZED).trim() !== '';
const rejectUnauthorized = rejectUnauthorizedExplicit
  ? String(process.env.DB_SSL_REJECT_UNAUTHORIZED || 'true').toLowerCase() === 'true'
  : !(Boolean(databaseUrl) && nodeEnv === 'production');

const dialectOptions = sslEnabled
  ? {
      ssl: {
        require: true,
        rejectUnauthorized,
      },
    }
  : undefined;

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
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