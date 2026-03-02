const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Recuperer tous les parametres du POS
router.get('/', settingsController.getSettings);

// Mettre a jour un ou plusieurs parametres
router.put('/', settingsController.updateSettings);

module.exports = router;