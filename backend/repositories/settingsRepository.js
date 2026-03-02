const db = require('../database');

// Pattern Repository : Isolation totale du SQL
const getSetting = (key) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row ? row.value : null);
        });
    });
};

const setSetting = (key, value) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value], function(err) {
            if (err) {
                return reject(err);
            }
            // this.changes retourne le nombre de lignes modifiees
            resolve(this.changes);
        });
    });
};

module.exports = { getSetting, setSetting };