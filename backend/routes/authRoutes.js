const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Import du système DRM (Ajuste le chemin si ton middleware est dans un autre dossier)
const licenseMiddleware = require('../middlewares/licenseMiddleware');

// Routes strictement publiques
router.post('/login', authController.login);

// Routes d'initialisation protégées par le DRM (Zero-Trust)
router.get('/setup-status', licenseMiddleware, authController.checkSetupStatus);
router.post('/setup', licenseMiddleware, authController.initialSetup);

module.exports = router;