const express = require("express");
const router = express.Router();
const authController = require("../controllers/controller.login");

router.post("/", authController.login);

module.exports = router;
