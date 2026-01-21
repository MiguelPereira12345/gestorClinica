require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors'); 
const route = require("./src/routes/route");
const registerRoute = require("./src/routes/register.route");
const planoRoute = require("./src/routes/route.plano");
const dependentesRoute = require("./src/routes/route.dependentes");
const consultaRoute = require("./src/routes/route.consulta");



const sequelize = require('./src/models/database');  
const { initModels } = require("./src/models/init-models");  

app.set('port', process.env.PORT || 3001);

app.use(express.json());
app.use(cors({
  origin: '*',
}));

initModels(sequelize);

// Testa a conexão com a base de dados
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão com a base de dados estabelecida com sucesso!');
  } catch (error) {
    console.error(' Erro ao conectar à base de dados:', error);
    process.exit(1);
  }
};

// Inicia o servidor
connectDB().then(() => {
  app.listen(app.get('port'), () => {
    console.log(` Servidor a correr na porta ${app.get('port')}`);
  });
});

//Login
app.use("/login", route);
// Register
app.use("/register", registerRoute);

// Disponibiliza rotas de registo na raiz para endpoints como /listusers
app.use("/", registerRoute);

// Rotas de plano
app.use('/plano', planoRoute);

// Rotas de dependentes
app.use('/dependentes', dependentesRoute);

// Rotas de consultas
app.use('/consultas', consultaRoute);

