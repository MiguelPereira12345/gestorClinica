const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/controller.consulta');

console.log('route.consulta loaded');

// GET /consultas -> lista todas as consultas
router.get('/', consultaController.listar_consultas);

// GET /consultas/:id_consulta -> obter uma consulta específica
router.get('/:id_consulta', consultaController.obter_consulta);

// POST /consultas -> cria uma nova consulta
router.post('/', consultaController.criar_consulta);

// PATCH /consultas/:id_consulta -> edita uma consulta existente
router.patch('/:id_consulta', consultaController.editar_consulta);

module.exports = router;
