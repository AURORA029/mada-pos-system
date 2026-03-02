const db = require('../database');

const getSummary = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT SUM(total_amount) as total_ca, COUNT(*) as total_orders 
            FROM orders 
            WHERE status = 'paye' 
            AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
        `;
        db.get(query, [], (err, row) => {
            if (err) return reject(err);
            resolve(row || { total_ca: 0, total_orders: 0 });
        });
    });
};

const getPayments = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT payment_method, SUM(total_amount) as total, COUNT(*) as count 
            FROM orders 
            WHERE status = 'paye' 
            AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime') 
            GROUP BY payment_method
        `;
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
};

const getDetails = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT o.id, o.created_at, o.customer_name, o.order_type, o.payment_method, o.total_amount, 
            GROUP_CONCAT(oi.quantity || 'x ' || oi.item_name, ' | ') as items 
            FROM orders o 
            LEFT JOIN order_items oi ON o.id = oi.order_id 
            WHERE o.status = 'paye' 
            AND strftime('%Y-%m', o.created_at) = strftime('%Y-%m', 'now', 'localtime') 
            GROUP BY o.id 
            ORDER BY o.created_at DESC
        `;
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
};

module.exports = { getSummary, getPayments, getDetails };