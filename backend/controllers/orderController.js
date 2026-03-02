const orderRepo = require('../repositories/orderRepository');

const createOrder = async (req, res) => {
    const { customer_name, order_type, total_amount, payment_method, cart_items } = req.body;

    // Zero Trust : Validation stricte du payload
    if (total_amount === undefined || isNaN(total_amount)) {
        return res.status(400).json({ error: "Le montant total est invalide ou manquant." });
    }

    if (!Array.isArray(cart_items) || cart_items.length === 0) {
        return res.status(400).json({ error: "La commande doit contenir au moins un article." });
    }

    try {
        const orderData = {
            customer_name: customer_name ? customer_name.trim() : 'Client',
            order_type: order_type === 'a_emporter' ? 'a_emporter' : 'sur_place', // Fallback sécurisé
            total_amount: parseFloat(total_amount),
            payment_method: payment_method || 'non_specifie',
            status: 'en_attente'
        };

        const orderId = await orderRepo.createOrderWithItems(orderData, cart_items);
        
        res.status(201).json({ 
            success: true, 
            order_id: orderId, 
            message: "Commande enregistree et securisee via transaction SQL." 
        });
    } catch (err) {
        console.error("[ORDER_CTRL_ERROR] Erreur createOrder:", err.message);
        res.status(500).json({ error: "Erreur critique lors de l'enregistrement de la commande." });
    }
};

const getOrders = async (req, res) => {
    try {
        const orders = await orderRepo.getAllOrders();
        res.json(orders);
    } catch (err) {
        console.error("[ORDER_CTRL_ERROR] Erreur getOrders:", err.message);
        res.status(500).json({ error: "Erreur lors de la recuperation des commandes." });
    }
};

const getStatistics = async (req, res) => {
    try {
        const stats = await orderRepo.getStats();
        res.json({
            total_orders: stats.total_orders || 0,
            total_revenue: stats.total_revenue || 0
        });
    } catch (err) {
        console.error("[ORDER_CTRL_ERROR] Erreur getStatistics:", err.message);
        res.status(500).json({ error: "Erreur lors du calcul des statistiques." });
    }
};

const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID de commande invalide." });
    }

    if (!status) {
        return res.status(400).json({ error: "Le statut est requis." });
    }

    try {
        const changes = await orderRepo.updateOrderStatus(parseInt(id, 10), status);
        if (changes === 0) {
            return res.status(404).json({ error: "Commande introuvable." });
        }
        res.json({ success: true, message: "Statut de la commande mis a jour." });
    } catch (err) {
        console.error("[ORDER_CTRL_ERROR] Erreur updateStatus:", err.message);
        res.status(500).json({ error: "Erreur lors de la mise a jour de la commande." });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getStatistics,
    updateStatus
};