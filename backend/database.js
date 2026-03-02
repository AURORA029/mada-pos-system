const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ZERO TRUST : Priorité absolue à la variable d'environnement injectée par Electron.
// Fallback de sécurité sur safeStoragePath ou process.cwd() pour l'environnement de développement.
const dbPath = process.env.DB_PATH || path.join(global.safeStoragePath || process.cwd(), 'mada_pos.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[DB_ERROR] Erreur de connexion a la base de donnees:', err.message);
    } else {
        console.log(`[DB_SYS] Connecte a la base de donnees SQLite Mada POS. Chemin : ${dbPath}`);
        
        db.serialize(() => {
            // Table Categories
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE COLLATE NOCASE
            )`);

            // Table Plats
            db.run(`CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                image_url TEXT,
                is_available BOOLEAN DEFAULT 1,
                is_deleted BOOLEAN DEFAULT 0,
                FOREIGN KEY(category_id) REFERENCES categories(id)
            )`);

            // Table Modes de Paiement (NOUVEAU MODULE)
            db.run(`CREATE TABLE IF NOT EXISTS payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                provider_name TEXT NOT NULL,
                account_number TEXT,
                motif_prefix TEXT,
                is_active BOOLEAN DEFAULT 1,
                is_mobile BOOLEAN DEFAULT 1
            )`, () => {
                db.get("SELECT COUNT(*) as count FROM payment_methods", (err, row) => {
                    if (row && row.count === 0) {
                        db.run(`INSERT INTO payment_methods (provider_name, account_number, motif_prefix, is_mobile) VALUES 
                            ('Especes', NULL, NULL, 0),
                            ('MVola', '0340000000', 'MADA', 1)`);
                    }
                });
            });

            // Table Commandes
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT,
                order_type TEXT NOT NULL DEFAULT 'sur_place', 
                total_amount REAL NOT NULL,
                payment_method TEXT,
                status TEXT DEFAULT 'en_attente',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Table Lignes de Commande
            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                item_id INTEGER,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
                FOREIGN KEY(item_id) REFERENCES menu_items(id)
            )`);

            // Index
            db.run(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)`);

            // Table Configurations
            db.run(`CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )`);
            
            // Table Clotures de Caisse (Etape 3.1)
            db.run(`CREATE TABLE IF NOT EXISTS daily_closings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                closing_date DATE DEFAULT (DATE('now', 'localtime')),
                declared_cash REAL NOT NULL,
                system_cash REAL NOT NULL,
                gap REAL NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });
    }
});

module.exports = db;