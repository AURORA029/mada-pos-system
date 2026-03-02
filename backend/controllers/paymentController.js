const paymentRepo = require('../repositories/paymentRepository');

const getActivePayments = async (req, res) => {
    try {
        const methods = await paymentRepo.getActive();
        res.json(methods);
    } catch (error) {
        console.error("[PAYMENT_CTRL] Erreur getActivePayments:", error.message);
        res.status(500).json({ error: "Erreur serveur." });
    }
};

const getAllPayments = async (req, res) => {
    try {
        const methods = await paymentRepo.getAll();
        res.json(methods);
    } catch (error) {
        console.error("[PAYMENT_CTRL] Erreur getAllPayments:", error.message);
        res.status(500).json({ error: "Erreur serveur." });
    }
};

const createPayment = async (req, res) => {
    const { provider_name, account_number, motif_prefix, is_mobile } = req.body;
    if (!provider_name) {
        return res.status(400).json({ error: "Le nom de l'operateur est requis." });
    }
    try {
        const id = await paymentRepo.create({ provider_name, account_number, motif_prefix, is_mobile });
        res.status(201).json({ success: true, id, message: "Moyen de paiement ajoute avec succes." });
    } catch (error) {
        console.error("[PAYMENT_CTRL] Erreur createPayment:", error.message);
        res.status(500).json({ error: "Erreur lors de l'ajout." });
    }
};

const updatePayment = async (req, res) => {
    const { id } = req.params;
    try {
        const changes = await paymentRepo.update(id, req.body);
        if (changes === 0) return res.status(404).json({ error: "Moyen de paiement introuvable." });
        res.json({ success: true, message: "Mise a jour effectuee." });
    } catch (error) {
        console.error("[PAYMENT_CTRL] Erreur updatePayment:", error.message);
        res.status(500).json({ error: "Erreur lors de la mise a jour." });
    }
};

const deletePayment = async (req, res) => {
    const { id } = req.params;
    try {
        const changes = await paymentRepo.deleteMethod(id);
        if (changes === 0) return res.status(400).json({ error: "Impossible de supprimer (introuvable ou systeme de base)." });
        res.json({ success: true, message: "Moyen de paiement supprime." });
    } catch (error) {
        console.error("[PAYMENT_CTRL] Erreur deletePayment:", error.message);
        res.status(500).json({ error: "Erreur lors de la suppression." });
    }
};

module.exports = { getActivePayments, getAllPayments, createPayment, updatePayment, deletePayment };