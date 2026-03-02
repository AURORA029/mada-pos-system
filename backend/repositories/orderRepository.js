const db = require('../database');

const createOrderWithItems = (orderData, items) => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            const queryOrder = `INSERT INTO orders (customer_name, order_type, total_amount, payment_method, status) VALUES (?, ?, ?, ?, ?)`;
            const paramsOrder = [
                orderData.customer_name || 'Client Anonyme',
                orderData.order_type || 'sur_place',
                Number(orderData.total_amount),
                orderData.payment_method || 'non_specifie',
                orderData.status || 'en_attente'
            ];

            db.run(queryOrder, paramsOrder, function(err) {
                if (err) {
                    console.error("[DB_ERROR]: Order Insert Failed", err);
                    db.run('ROLLBACK');
                    return reject(err);
                }
                
                const orderId = this.lastID;
                if (!items || items.length === 0) {
                    db.run('COMMIT');
                    return resolve(orderId);
                }

                const stmt = db.prepare(`INSERT INTO order_items (order_id, item_id, item_name, quantity, price) VALUES (?, ?, ?, ?, ?)`);
                let completed = 0;
                let hasError = false;

                items.forEach((item) => {
                    const itemId = item.item_id ? parseInt(item.item_id, 10) : null;
                    stmt.run([orderId, itemId, item.name, item.quantity, item.price], (err) => {
                        if (hasError) return;
                        if (err) {
                            hasError = true;
                            console.error("[DB_ERROR]: Item Insert Failed", err);
                            db.run('ROLLBACK');
                            return reject(err);
                        }

                        completed++;
                        if (completed === items.length) {
                            stmt.finalize();
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    db.run('ROLLBACK');
                                    return reject(err);
                                }
                                resolve(orderId);
                            });
                        }
                    });
                });
            });
        });
    });
};

const getAllOrders = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`, [], (err, orders) => {
            if (err) return reject(err);
            if (!orders || orders.length === 0) return resolve([]);
            
            db.all(`SELECT * FROM order_items`, [], (err, items) => {
                if (err) return reject(err);
                const ordersWithItems = orders.map(order => ({
                    ...order,
                    items: items.filter(item => item.order_id === order.id)
                }));
                resolve(ordersWithItems);
            });
        });
    });
};

const getStats = () => {
    return new Promise((resolve, reject) => {
        const query = `SELECT COUNT(*) as total_orders, SUM(total_amount) as total_revenue FROM orders WHERE status = 'paye'`;
        db.get(query, [], (err, row) => {
            if (err) return reject(err);
            resolve(row || { total_orders: 0, total_revenue: 0 });
        });
    });
};

const updateOrderStatus = (id, status) => {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id], function(err) {
            if (err) return reject(err);
            resolve(this.changes);
        });
    });
};

module.exports = { createOrderWithItems, getAllOrders, getStats, updateOrderStatus };