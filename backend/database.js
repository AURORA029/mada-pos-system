const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const baseDir = global.safeStoragePath || process.cwd();
const dbPath = path.join(baseDir, 'mada_pos.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
    } else {
        console.log('Connecté à la base de données SQLite Mada POS.');
        
        // Création des tables si elles n'existent pas
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )`);

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

            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_name TEXT,
                total_amount REAL NOT NULL,
                payment_method TEXT,
                status TEXT DEFAULT 'en_attente',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                price REAL NOT NULL,
                FOREIGN KEY(order_id) REFERENCES orders(id)
            )`);

            // NOUVELLE TABLE : Configuration système et Sécurité
            db.run(`CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )`);

            // Initialisation Zero Trust : Mot de passe par défaut ("admin123")
            db.get(`SELECT value FROM settings WHERE key = 'admin_password'`, (err, row) => {
                if (!row) {
                    const salt = bcrypt.genSaltSync(10);
                    const hash = bcrypt.hashSync('admin123', salt);
                    db.run(`INSERT INTO settings (key, value) VALUES ('admin_password', ?)`, [hash]);
                    console.log(' Mot de passe administrateur par défaut généré (admin123).');
                }
            });
        });
    }
});

module.exports = db;