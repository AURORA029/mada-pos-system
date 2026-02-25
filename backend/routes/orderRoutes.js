// ==========================================
// MADA POS SYSTEM - Routes API Commandes
// Fichier : backend/routes/orderRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const db = require('../database');

// 1. Créer une nouvelle commande AVEC ses détails
router.post('/', (req, res) => {
    const { customer_name, total_amount, payment_method, cart_items } = req.body;

    if (!total_amount || !cart_items || cart_items.length === 0) {
        return res.status(400).json({ error: "Le montant total et les articles sont requis." });
    }

    // On insère d'abord la commande globale
    const queryOrder = `INSERT INTO orders (customer_name, total_amount, payment_method, status) VALUES (?, ?, ?, ?)`;
    const valuesOrder = [customer_name || 'Client Anonyme', total_amount, payment_method || 'en_attente', 'en_attente'];

    db.run(queryOrder, valuesOrder, function(err) {
        if (err) {
            console.error("Erreur SQL Commande :", err.message);
            return res.status(500).json({ error: "Erreur lors de l'enregistrement de la commande." });
        }
        
        const orderId = this.lastID; // On récupère l'ID de la commande fraîchement créée

        // On insère ensuite chaque plat lié à cette commande
        const queryItem = `INSERT INTO order_items (order_id, item_name, quantity, price) VALUES (?, ?, ?, ?)`;
        
        // On exécute les insertions en boucle de manière sécurisée
        cart_items.forEach(item => {
            db.run(queryItem, [orderId, item.name, item.quantity, item.price], (err) => {
                if (err) console.error("Erreur SQL Item :", err.message);
            });
        });

        res.status(201).json({ 
            success: true, 
            order_id: orderId, 
            message: "Commande et détails enregistrés avec succès." 
        });
    });
});

// 2. Récupérer toutes les commandes (Utilisé par le Dashboard Caisse)
router.get('/', (req, res) => {
    // Sélectionne toutes les commandes, de la plus récente à la plus ancienne
    const query = `SELECT * FROM orders ORDER BY created_at DESC`;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Erreur SQL :", err.message);
            return res.status(500).json({ error: "Erreur lors de la récupération des commandes." });
        }
        res.json(rows);
    });
});

// 3. Récupérer les statistiques de vente
router.get('/stats', (req, res) => {
    // Calcul du CA total et du nombre de commandes terminées
    const query = `
        SELECT 
            COUNT(*) as total_orders,
            SUM(total_amount) as total_revenue
        FROM orders 
        WHERE status = 'paye'
    `;
    
    db.get(query, [], (err, row) => {
        if (err) {
            console.error("Erreur SQL Stats :", err.message);
            return res.status(500).json({ error: "Erreur lors du calcul des statistiques." });
        }
        res.json({
            total_orders: row.total_orders || 0,
            total_revenue: row.total_revenue || 0
        });
    });
});

// 4. Mettre à jour le statut d'une commande
router.put('/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: "Le nouveau statut est requis." });
    }

    const query = `UPDATE orders SET status = ? WHERE id = ?`;
    
    db.run(query, [status, orderId], function(err) {
        if (err) {
            console.error("Erreur SQL lors de la mise à jour :", err.message);
            return res.status(500).json({ error: "Erreur lors de la mise à jour de la commande." });
        }
        res.json({ success: true, message: "Statut mis à jour avec succès." });
    });
});

module.exports = router;