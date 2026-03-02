const db = require('../database');

const getAllCategories = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM categories ORDER BY name ASC`, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const createCategory = (name) => {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO categories (name) VALUES (?)`, [name], function(err) {
            if (err) return reject(err);
            resolve({ id: this.lastID, name });
        });
    });
};

const getActiveItems = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT menu_items.*, categories.name as category_name 
            FROM menu_items 
            LEFT JOIN categories ON menu_items.category_id = categories.id
            WHERE menu_items.is_deleted = 0
        `;
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

const createItem = (itemData) => {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO menu_items (category_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)`;
        const params = [itemData.category_id, itemData.name, itemData.description, itemData.price, itemData.imageUrl];
        
        db.run(query, params, function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
    });
};

const softDeleteItem = (id) => {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE menu_items SET is_deleted = 1 WHERE id = ?`, [id], function(err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
};

const updateItemAvailability = (id, isAvailable) => {
    return new Promise((resolve, reject) => {
        // Double sécurité : on ne modifie la disponibilité que si le plat n'est pas supprimé
        const query = `UPDATE menu_items SET is_available = ? WHERE id = ? AND is_deleted = 0`;
        db.run(query, [isAvailable, id], function(err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
};

module.exports = {
    getAllCategories,
    createCategory,
    getActiveItems,
    createItem,
    softDeleteItem,
    updateItemAvailability
};