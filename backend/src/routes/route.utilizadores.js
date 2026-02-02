const express = require('express');
const router = express.Router();
const utilizadoresController = require('../controllers/controller.utilizadores');
const { verificarToken, requireRole } = require('../middleware/authMiddleware');

console.log('route.utilizadores loaded');

// POST pedir link/código de recuperação
router.post('/password-reset/request', utilizadoresController.password_reset_request);

// POST confirmar redefinição via código
router.post('/password-reset/confirm', utilizadoresController.password_reset_confirm);

// POST criar utilizador (público: registo)
router.post('/', utilizadoresController.criar_utilizador);

// Rotas protegidas (admin)
router.use(verificarToken, requireRole('admin'));

// GET todos (apenas tipo 'user' ativos)
router.get('/', utilizadoresController.get_utilizadores);

// GET TODOS para debug (incluindo admins e inativos)
router.get('/todos/debug', utilizadoresController.get_todos_utilizadores);

// GET procurar por nome
router.get('/procurar', utilizadoresController.procurar_utilizadores);

// GET utilizador por ID
router.get('/:id', utilizadoresController.get_utilizador_by_id);

// PUT/PATCH
router.put('/:id', utilizadoresController.atualizar_utilizador);
router.patch('/:id', utilizadoresController.atualizar_utilizador);

// PATCH desativar utilizador
router.patch('/:id/desativar', utilizadoresController.desativar_utilizador);

// DELETE apagar utilizador
router.delete('/:id', utilizadoresController.apagar_utilizador);

module.exports = router;
