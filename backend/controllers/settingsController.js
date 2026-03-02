const db = require('../database');

const getSettings = (req, res) => {
    db.all(`SELECT * FROM settings`, [], (err, rows) => {
        if (err) {
            console.error("[SETTINGS_ERROR] Erreur lecture:", err.message);
            return res.status(500).json({ error: "Erreur lors de la lecture des parametres." });
        }
        
        // On transforme le tableau d'objets SQL en un seul objet clé/valeur facile a lire pour React
        const settingsObj = {};
        rows.forEach(row => {
            settingsObj[row.key] = row.value;
        });
        
        res.json(settingsObj);
    });
};

const updateSettings = (req, res) => {
    const settings = req.body; // Doit etre un objet ex: { "mobile_money_number": "03400", "mobile_money_name": "MVola" }

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
        return res.status(400).json({ error: "Format de donnees invalide. Un objet est attendu." });
    }

    // Zero Trust & Anti-Fragilite : On utilise une transaction pour ne pas corrompre les settings si ça coupe
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // UPSERT SQLite (Insere si nouveau, Met a jour si existe)
        const stmt = db.prepare(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`);
        
        let hasError = false;

        for (const [key, value] of Object.entries(settings)) {
            // Cast strict en String pour eviter les crashs SQL
            stmt.run([key, String(value)], (err) => {
                if (err && !hasError) {
                    hasError = true;
                    console.error("[SETTINGS_ERROR] Erreur insertion clé", key, ":", err.message);
                    db.run('ROLLBACK');
                }
            });
        }
        
        stmt.finalize();

        db.run('COMMIT', (err) => {
            if (hasError) return res.status(500).json({ error: "Erreur pendant la sauvegarde des parametres." });
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: "Erreur critique de la transaction." });
            }
            res.json({ success: true, message: "Configurations mises a jour avec succes." });
        });
    });
};

module.exports = {
    getSettings,
    updateSettings
};