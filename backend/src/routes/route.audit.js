const express = require('express');
const router = express.Router();

const auditController = require('../controllers/controller.audit');

router.get('/', auditController.list);

module.exports = router;
