const express = require('express');
const router = express.Router();

const patientController = require('../controllers/controller.patient');
const { verificarToken } = require('../middleware/authMiddleware');
const { requireAdminOrSelf } = require('../middleware/accessControl');

console.log('route.patient loaded');

router.use(verificarToken);

router.get('/:id', requireAdminOrSelf('id'), patientController.get_patient_profile);
router.get('/:id/dependents', requireAdminOrSelf('id'), patientController.list_dependents);
router.get('/:id/consents', requireAdminOrSelf('id'), patientController.get_consents);
router.put('/:id/consents', requireAdminOrSelf('id'), patientController.upsert_consent);

module.exports = router;
