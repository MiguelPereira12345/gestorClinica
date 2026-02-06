const express = require('express');
const router = express.Router();
const gestorController = require('../controllers/controller.gestor');
const { requireRole } = require('../middleware/authMiddleware');

// GET todos os gestores
router.get('/', gestorController.get_gestores);

// GET gestor por ID
router.get('/:id', gestorController.get_gestor);

// POST gestor
router.post('/', requireRole('admin'), gestorController.criar_gestor);

// PUT/PATCH gestor
router.put('/:id', requireRole('admin'), gestorController.editar_gestor);
router.patch('/:id', requireRole('admin'), gestorController.editar_gestor);

// DELETE gestor
router.delete('/:id', requireRole('admin'), gestorController.deletar_gestor);

module.exports = router;
