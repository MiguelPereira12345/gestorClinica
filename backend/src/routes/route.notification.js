const express = require('express');
const router = express.Router();

const controller = require('../controllers/controller.notification');
const { requireRole } = require('../middleware/authMiddleware');

console.log('route.notification loaded');

// list: admin can filter by userId; patient sees own
router.get('/', controller.list);

// create: only admin
router.post('/', requireRole('admin'), controller.create);

// mark read: self or admin
router.patch('/:id_notification/read', controller.mark_read);

module.exports = router;
