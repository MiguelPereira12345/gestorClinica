const express = require('express');
const router = express.Router();

const auditController = require('../controllers/controller.audit');

console.log('route.audit loaded');

router.get('/', auditController.list);

module.exports = router;
