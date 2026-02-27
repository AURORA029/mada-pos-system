const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes publiques
router.post('/login', authController.login);
router.get('/setup-status', authController.checkSetupStatus);
router.post('/setup', authController.initialSetup);

module.exports = router;