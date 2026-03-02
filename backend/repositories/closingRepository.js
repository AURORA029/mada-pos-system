const db = require('../database');

/**
 * Calcule ce que le système attend en espèces uniquement pour la clôture.
 * Utilise une fenêtre de 24h glissante pour éviter le bug de minuit.
 */
const getSystemExpectedCash = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT SUM(total_amount) as expected 
            FROM orders 
            WHERE status = 'paye' 
            AND (payment_method LIKE '%espece%' OR payment_method LIKE '%espèce%' OR payment_method = 'Cash')
            AND created_at > (SELECT COALESCE(MAX(created_at), '1970-01-01') FROM daily_closings)
        `;
        db.get(query, [], (err, row) => {
            if (err) return reject(err);
            resolve(row.expected || 0);
        });
    });
};

const saveClosing = (closingData) => {
    return new Promise((resolve, reject) => {
        const query = `
            INSERT INTO daily_closings (declared_cash, system_cash, gap, notes)
            VALUES (?, ?, ?, ?)
        `;
        const params = [
            closingData.declared_cash,
            closingData.system_cash,
            closingData.gap,
            closingData.notes || ''
        ];
        db.run(query, params, function(err) {
            if (err) return reject(err);
            resolve(this.lastID);
        });
    });
};

const getHistory = () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM daily_closings ORDER BY created_at DESC LIMIT 30`, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
};

/**
 * RECTIFICATION : Le CA Réel (real_revenue) inclut désormais :
 * SUM(Cash Déclaré) + SUM(Commandes Mobile Money Validées)
 */
const getMonthlyStats = (year) => {
    return new Promise((resolve, reject) => {
        const targetYear = year || new Date().getFullYear().toString();
        
        // 1. Chiffre d'Affaire Total (Toutes méthodes)
        const queryOrders = `
            SELECT strftime('%Y-%m', created_at) as month, SUM(total_amount) as theoretical_revenue
            FROM orders 
            WHERE status = 'paye' AND strftime('%Y', created_at) = ?
            GROUP BY month
        `;
        
        // 2. Chiffre d'Affaire Mobile Money (Système) par mois
        const queryMobile = `
            SELECT strftime('%Y-%m', created_at) as month, SUM(total_amount) as mobile_total
            FROM orders 
            WHERE status = 'paye' 
            AND payment_method NOT LIKE '%espece%' 
            AND payment_method NOT LIKE '%espèce%'
            AND payment_method != 'Cash'
            AND strftime('%Y', created_at) = ?
            GROUP BY month
        `;

        // 3. Cash Déclaré par mois
        const queryClosings = `
            SELECT strftime('%Y-%m', created_at) as month, SUM(declared_cash) as cash_total
            FROM daily_closings 
            WHERE strftime('%Y', created_at) = ?
            GROUP BY month
        `;

        db.all(queryOrders, [targetYear], (err, ordersData) => {
            if (err) return reject(err);
            db.all(queryMobile, [targetYear], (err, mobileData) => {
                if (err) return reject(err);
                db.all(queryClosings, [targetYear], (err, closingsData) => {
                    if (err) return reject(err);

                    const monthlyMap = {};
                    for(let i=1; i<=12; i++) {
                        const m = i < 10 ? `0${i}` : `${i}`;
                        monthlyMap[`${targetYear}-${m}`] = { month: `${targetYear}-${m}`, theoretical: 0, real: 0 };
                    }
                    
                    // On remplit le théorique (Tout)
                    ordersData.forEach(row => { if(monthlyMap[row.month]) monthlyMap[row.month].theoretical = row.theoretical_revenue; });
                    
                    // Calcul du RÉEL = Cash Déclaré + Mobile Money Système
                    const mobileMap = {};
                    mobileData.forEach(row => { mobileMap[row.month] = row.mobile_total; });
                    
                    closingsData.forEach(row => {
                        if(monthlyMap[row.month]) {
                            const mobileForMonth = mobileMap[row.month] || 0;
                            monthlyMap[row.month].real = row.cash_total + mobileForMonth;
                        }
                    });

                    resolve(Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)));
                });
            });
        });
    });
};

const getDashboardKPIs = () => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                /* THÉORIQUE MENSUEL (TOUT) */
                (SELECT SUM(total_amount) FROM orders WHERE status = 'paye' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')) as cur_theo,
                
                /* MOBILE MONEY MENSUEL (SYSTÈME) */
                (SELECT SUM(total_amount) FROM orders WHERE status = 'paye' AND payment_method NOT LIKE '%espece%' AND payment_method NOT LIKE '%espèce%' AND payment_method != 'Cash' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')) as cur_mobile,
                
                /* CASH DÉCLARÉ MENSUEL */
                (SELECT SUM(declared_cash) FROM daily_closings WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')) as cur_cash,
                
                (SELECT SUM(gap) FROM daily_closings WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')) as cur_gap,
                (SELECT COUNT(*) FROM orders WHERE status = 'paye' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')) as cur_orders,
                
                /* ALL TIME */
                (SELECT SUM(total_amount) FROM orders WHERE status = 'paye') as all_theo,
                (SELECT SUM(total_amount) FROM orders WHERE status = 'paye' AND payment_method NOT LIKE '%espece%' AND payment_method NOT LIKE '%espèce%' AND payment_method != 'Cash') as all_mobile,
                (SELECT SUM(declared_cash) FROM daily_closings) as all_cash,
                (SELECT SUM(gap) FROM daily_closings) as all_gap,
                (SELECT COUNT(*) FROM orders WHERE status = 'paye') as all_orders
        `;
        db.get(query, [], (err, row) => {
            if (err) return reject(err);
            resolve({
                current_month: {
                    theoretical: row.cur_theo || 0,
                    real: (row.cur_cash || 0) + (row.cur_mobile || 0), // Fusion Cash + Mobile
                    gap: row.cur_gap || 0,
                    orders: row.cur_orders || 0
                },
                all_time: {
                    theoretical: row.all_theo || 0,
                    real: (row.all_cash || 0) + (row.all_mobile || 0), // Fusion Cash + Mobile
                    gap: row.all_gap || 0,
                    orders: row.all_orders || 0
                }
            });
        });
    });
};

module.exports = { getSystemExpectedCash, saveClosing, getHistory, getMonthlyStats, getDashboardKPIs };