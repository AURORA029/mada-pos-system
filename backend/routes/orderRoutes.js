// ==========================================
// MADA POS SYSTEM - Routes API Commandes (Clean Architecture)
// Fichier : backend/routes/orderRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Creer une nouvelle commande (Protégé par Transaction SQL)
router.post('/', orderController.createOrder);

// Recuperer toutes les commandes
router.get('/', orderController.getOrders);

// Recuperer les statistiques de vente
router.get('/stats', orderController.getStatistics);

// Mettre a jour le statut d'une commande (ex: paye, annule, pret)
router.put('/:id/status', orderController.updateStatus);

module.exports = router;