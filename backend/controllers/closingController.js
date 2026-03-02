const closingRepo = require('../repositories/closingRepository');

const performClosing = async (req, res) => {
    const { declared_cash, notes } = req.body;
    if (declared_cash === undefined || isNaN(declared_cash)) {
        return res.status(400).json({ error: "Le montant declare est requis." });
    }
    try {
        const system_cash = await closingRepo.getSystemExpectedCash();
        const gap = parseFloat(declared_cash) - system_cash;
        const closingId = await closingRepo.saveClosing({
            declared_cash: parseFloat(declared_cash),
            system_cash,
            gap,
            notes: notes ? notes.trim() : ''
        });
        res.status(201).json({
            success: true,
            message: "Cloture enregistree.",
            data: { id: closingId, declared_cash: parseFloat(declared_cash), system_expected: system_cash, gap: gap }
        });
    } catch (error) {
        console.error("[CLOSING_CTRL] Erreur performClosing:", error.message);
        res.status(500).json({ error: "Erreur serveur." });
    }
};

const getClosingHistory = async (req, res) => {
    try {
        const history = await closingRepo.getHistory();
        res.json(history);
    } catch (error) {
        console.error("[CLOSING_CTRL] Erreur getClosingHistory:", error.message);
        res.status(500).json({ error: "Erreur recuperation de l'historique." });
    }
};

const getMonthlyData = async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear().toString();
        const data = await closingRepo.getMonthlyStats(year);
        res.json(data);
    } catch (error) {
        console.error("[CLOSING_CTRL] Erreur getMonthlyData:", error.message);
        res.status(500).json({ error: "Erreur calcul des statistiques mensuelles." });
    }
};

const getKPIs = async (req, res) => {
    try {
        const data = await closingRepo.getDashboardKPIs();
        res.json(data);
    } catch (error) {
        console.error("[CLOSING_CTRL] Erreur getKPIs:", error.message);
        res.status(500).json({ error: "Erreur recuperation KPIs." });
    }
};

module.exports = { performClosing, getClosingHistory, getMonthlyData, getKPIs };