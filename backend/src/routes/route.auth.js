const express = require('express');
const router = express.Router();

const authController = require('../controllers/controller.auth');
const { verificarToken } = require('../middleware/authMiddleware');

console.log('route.auth loaded');

// Login (admin desktop)
router.post('/admin/login', authController.login_admin);

// Login (paciente mobile)
router.post('/paciente/login', authController.login_paciente);

// Refresh token
router.post('/refresh', authController.refresh);

// Logout (revoga refresh token)
router.post('/logout', authController.logout);

// Current user (access token)
router.get('/me', verificarToken, authController.me);

module.exports = router;
