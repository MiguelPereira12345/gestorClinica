const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const controller = require('../controllers/controller.file');

console.log('route.file loaded');

const tmpDir = path.join(__dirname, '..', '..', 'uploads_tmp');
const upload = multer({ dest: tmpDir });

router.get('/', controller.list);
router.post('/upload', upload.single('file'), controller.upload);
router.get('/:id_file/download', controller.download);
router.delete('/:id_file', controller.remove);

module.exports = router;
