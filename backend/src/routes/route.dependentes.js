const express = require('express');
const router = express.Router();
const dependentesController = require('../controllers/controller.dependentes');

console.log('route.dependentes loaded');

// GET /dependentes\
router.get('/', dependentesController.get_dependentes);

// POST /dependentes
router.post('/', dependentesController.criar_dependente);

// DELETE /dependentes/:id 
router.delete('/:id', dependentesController.delete_dependente);

// PUT/PATCH /dependentes/:id 
router.put('/:id', dependentesController.edit_dependente);
router.patch('/:id', dependentesController.edit_dependente);

module.exports = router;

