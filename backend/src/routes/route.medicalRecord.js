const express = require('express');
const router = express.Router();

const controller = require('../controllers/controller.medicalRecord');
const { verificarToken, requireRole } = require('../middleware/authMiddleware');

console.log('route.medicalRecord loaded');

router.use(verificarToken, requireRole('admin'));

router.get('/:patientId', controller.get_by_patient);
router.put('/:patientId', controller.upsert_by_patient);

module.exports = router;
