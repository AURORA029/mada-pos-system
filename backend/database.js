const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ZERO TRUST : Localisation de la DB
const dbPath = process.env.DB_PATH || path.join(global.safeStoragePath || process.cwd(), 'mada_pos.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[DB_ERROR] Erreur de connexion:', err.message);
    } else {
        console.log(`[DB_SYS] Connecte a : ${dbPath}`);
        
        db.serialize(() => {
            // 1. Initialisation standard des tables
            db.run(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE)`);
            
            db.run(`CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                image_url TEXT,
                is_available BOOLEAN DEFAULT 1,
                FOREIGN KEY(category_id) REFERENCES categories(id)
            )`);

            // 2. 🛡️ AUTO-PATCHER (Migration a chaud)
            // On verifie si la colonne is_deleted existe, sinon on l'ajoute
            db.all("PRAGMA table_info(menu_items)", (err, rows) => {
                if (err) return;
                const hasIsDeleted = rows.some(column => column.name === 'is_deleted');
                if (!hasIsDeleted) {
                    console.log("[DB_MIGRATION] Ajout de la colonne is_deleted a menu_items...");
                    db.run("ALTER TABLE menu_items ADD COLUMN is_deleted BOOLEAN DEFAULT 0");
                }
            });

            // 3. Autres tables
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
                            ('Especes', NULL, NULL, 0),`);
                            console.log("[DB_SEED] Mode de paiement 'Espèces' initialisé par défaut.");
                    }
                });
            });

            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT,
                order_type TEXT NOT NULL DEFAULT 'sur_place', 
                total_amount REAL NOT NULL,
                payment_method TEXT,
                status TEXT DEFAULT 'en_attente',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

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

            db.run(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
            db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
            
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
