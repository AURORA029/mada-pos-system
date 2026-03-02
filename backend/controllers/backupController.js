const path = require('path');
const fs = require('fs');

const downloadBackup = (req, res) => {
    const baseDir = global.safeStoragePath || process.cwd();
    const dbPath = path.join(baseDir, 'mada_pos.sqlite');

    if (!fs.existsSync(dbPath)) {
        return res.status(404).json({ error: "Fichier de base de donnees introuvable." });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `mada_pos_backup_${timestamp}.sqlite`;

    res.download(dbPath, fileName, (err) => {
        if (err) {
            console.error("[BACKUP_CTRL] Erreur lors du telechargement:", err.message);
            // On ne renvoie pas d'erreur si les headers sont deja partis
            if (!res.headersSent) {
                res.status(500).json({ error: "Erreur lors de la generation de la sauvegarde." });
            }
        }
    });
};

module.exports = { downloadBackup };