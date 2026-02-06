const express = require('express');
const router = express.Router();

const controller = require('../controllers/controller.schedule');

router.get('/doctor', controller.list_doctor_schedules);
router.post('/doctor', controller.create_doctor_schedule);
router.delete('/doctor/:id_schedule', controller.delete_doctor_schedule);

router.get('/holidays', controller.list_holidays);
router.put('/holidays', controller.upsert_holiday);

router.get('/occupancy/month', controller.month_occupancy);

module.exports = router;
