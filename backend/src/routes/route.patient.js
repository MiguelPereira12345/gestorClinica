const express = require('express');
const router = express.Router();

const patientController = require('../controllers/controller.patient');
const { verificarToken } = require('../middleware/authMiddleware');
const { requireAdminOrSelf, requireStaffOrSelf } = require('../middleware/accessControl');

console.log('route.patient loaded');

router.use(verificarToken);

// contacto do paciente (para staff ou o próprio)
router.get('/:id/contact', requireStaffOrSelf('id'), patientController.get_patient_contact);

router.get('/:id', requireAdminOrSelf('id'), patientController.get_patient_profile);
router.get('/:id/dependents', requireAdminOrSelf('id'), patientController.list_dependents);
router.get('/:id/dependents/:id_dependente', requireAdminOrSelf('id'), patientController.get_dependent);
router.get('/:id/planos', requireAdminOrSelf('id'), patientController.list_planos);
router.get('/:id/planos/:id_tratamento', requireAdminOrSelf('id'), patientController.get_plano);
router.get('/:id/planos/:id_tratamento/download', requireAdminOrSelf('id'), patientController.download_plano_pdf);
router.get('/:id/consultas', requireAdminOrSelf('id'), patientController.list_consultas);
router.get('/:id/consultas/:id_consulta', requireAdminOrSelf('id'), patientController.get_consulta);
router.post('/:id/consultas/request', requireAdminOrSelf('id'), patientController.request_consulta);
router.get('/:id/consents', requireAdminOrSelf('id'), patientController.get_consents);
router.put('/:id/consents', requireAdminOrSelf('id'), patientController.upsert_consent);

module.exports = router;
