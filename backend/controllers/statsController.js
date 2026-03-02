const statsRepository = require('../repositories/statsRepository');

const exportCSV = async (req, res) => {
    try {
        const summary = await statsRepository.getSummary();
        const payments = await statsRepository.getPayments();
        const details = await statsRepository.getDetails();

        // Ajout du BOM UTF-8 pour forcer Excel à lire les accents (é, à, etc.)
        let csv = '\uFEFF'; 

        // BLOC 1 : RÉSUMÉ
        csv += "=== RESUME GLOBAL DU MOIS EN COURS ===\n";
        csv += "Chiffre d'Affaires Total (Ar);Total Commandes\n";
        csv += `${summary.total_ca || 0};${summary.total_orders || 0}\n\n`;

        // BLOC 2 : PAIEMENTS
        csv += "=== VENTES PAR MODE DE PAIEMENT ===\n";
        csv += "Mode de Paiement;Montant (Ar);Nombre de Commandes\n";
        payments.forEach(p => {
            csv += `${p.payment_method || 'Inconnu'};${p.total};${p.count}\n`;
        });
        csv += "\n";

        // BLOC 3 : DÉTAILS
        csv += "=== HISTORIQUE DETAILLE DES COMMANDES ===\n";
        csv += "ID;Date;Client;Type;Paiement;Montant (Ar);Articles\n";
        details.forEach(d => {
            const date = new Date(d.created_at).toLocaleString('fr-FR');
            // Echappement des guillemets pour ne pas briser le CSV
            const items = d.items ? `"${d.items.replace(/"/g, '""')}"` : '""';
            const client = d.customer_name ? `"${d.customer_name.replace(/"/g, '""')}"` : '""';
            csv += `${d.id};${date};${client};${d.order_type};${d.payment_method};${d.total_amount};${items}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="MadaPOS_Stats_Mensuelles.csv"`);
        res.status(200).send(csv);

    } catch (error) {
        console.error("[STATS_CTRL] Erreur export CSV:", error);
        res.status(500).json({ error: "Erreur génération CSV" });
    }
};

module.exports = { exportCSV };          