const db = require('../database');

// Application du pattern Repository : Isolation totale du SQL
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

module.exports = { getSetting };