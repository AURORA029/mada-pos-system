const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Route publique (pour le menu client)
router.get('/active', paymentController.getActivePayments);

// Routes admin
router.get('/', paymentController.getAllPayments);
router.post('/', paymentController.createPayment);
router.put('/:id', paymentController.updatePayment);
router.delete('/:id', paymentController.deletePayment);

module.exports = router;