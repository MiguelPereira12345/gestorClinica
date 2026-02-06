const express = require('express');
const router = express.Router();
const consultaController = require('../controllers/controller.consulta');

// GET lista todas as consultas
router.get('/', consultaController.listar_consultas);

// GET obter uma consulta específica
router.get('/:id_consulta', consultaController.obter_consulta);

// POST cria uma nova consulta
router.post('/', consultaController.criar_consulta);

// PATCH /consultas/:id_consulta -> edita uma consulta existente
router.patch('/:id_consulta', consultaController.editar_consulta);

// PATCH cancelamento até 48h antes
router.patch('/:id_consulta/cancelar', consultaController.cancelar_consulta);

// PATCH aprovar/rejeitar pedido (solicitações de paciente)
router.patch('/:id_consulta/aprovar', consultaController.aprovar_pedido);
router.patch('/:id_consulta/rejeitar', consultaController.rejeitar_pedido);

// PATCH remarcar 
router.patch('/:id_consulta/remarcar', consultaController.remarcar_consulta);

// DELETE remove uma consulta
router.delete('/:id_consulta', consultaController.deletar_consulta);

module.exports = router;
