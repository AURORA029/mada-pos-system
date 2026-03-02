const db = require('../database');

const getAll = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM payment_methods ORDER BY id ASC`, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const getActive = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY id ASC`, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const create = (data) => {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO payment_methods (provider_name, account_number, motif_prefix, is_mobile) VALUES (?, ?, ?, ?)`;
        db.run(query, [data.provider_name, data.account_number, data.motif_prefix, data.is_mobile ? 1 : 0], function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
    });
};

const update = (id, data) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE payment_methods SET provider_name = ?, account_number = ?, motif_prefix = ?, is_mobile = ?, is_active = ? WHERE id = ?`;
        db.run(query, [data.provider_name, data.account_number, data.motif_prefix, data.is_mobile ? 1 : 0, data.is_active ? 1 : 0, id], function(err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
};

const deleteMethod = (id) => {
    return new Promise((resolve, reject) => {
        // Interdit de supprimer l'argent comptant (Cash)
        db.run(`DELETE FROM payment_methods WHERE id = ? AND is_mobile = 1`, [id], function(err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
};

module.exports = { getAll, getActive, create, update, deleteMethod };