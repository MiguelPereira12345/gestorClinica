const express = require('express');
const router = express.Router();
const planoController = require('../controllers/controller.plano');

console.log('route.plano loaded');

// Listar 
router.get('/', planoController.listar_planos);

// listar plano específico
router.get('/:id_tratamento', planoController.obter_plano);

// Criar novo plano
router.post('/plano', planoController.criar_plano);

// Atualizar plano
router.patch('/:id_tratamento', planoController.editar_plano);
router.put('/:id_tratamento', planoController.editar_plano);

// Eliminar plano
router.delete('/:id_tratamento', planoController.apagar_plano);

module.exports = router;

