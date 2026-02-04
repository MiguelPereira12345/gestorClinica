const express = require('express');
const router = express.Router();

const controller = require('../controllers/controller.declaration');
const { requireRole } = require('../middleware/authMiddleware');

console.log('route.declaration loaded');

router.get('/', controller.list);
router.get('/:id_declaration/download', controller.download);

// create only admin
router.post('/', requireRole('admin'), controller.create);

module.exports = router;
