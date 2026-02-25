// ==========================================
// MADA POS SYSTEM - Script d'initialisation des données (Seed)
// Fichier : backend/seed.js
// ==========================================

const db = require('./database');

console.log("Démarrage du script d'initialisation des données...");

db.serialize(() => {
    // 1. Nettoyage préalable pour éviter les doublons lors de tests multiples
    db.run(`DELETE FROM menu_items`);
    db.run(`DELETE FROM categories`);

    // 2. Création de la catégorie "Plats Malagasy"
    db.run(`INSERT INTO categories (name) VALUES (?)`, ['Plats Malagasy'], function(err) {
        if (err) return console.error("Erreur insertion catégorie:", err.message);
        
        const platId = this.lastID;
        
        // Insertion des plats liés à cette catégorie
        const insertItem = db.prepare(`INSERT INTO menu_items (category_id, name, description, price, is_available) VALUES (?, ?, ?, ?, ?)`);
        
        insertItem.run(platId, 'Romazava au Boeuf', 'Bouillon traditionnel malgache avec viande de boeuf et brèdes', 15000, 1);
        insertItem.run(platId, 'Ravitoto sy Henakisoa', 'Feuilles de manioc pilées avec viande de porc', 12000, 1);
        insertItem.finalize();
    });

    // 3. Création de la catégorie "Boissons"
    db.run(`INSERT INTO categories (name) VALUES (?)`, ['Boissons'], function(err) {
        if (err) return console.error("Erreur insertion catégorie:", err.message);
        
        const boissonId = this.lastID;
        
        // Insertion des boissons
        const insertItem = db.prepare(`INSERT INTO menu_items (category_id, name, description, price, is_available) VALUES (?, ?, ?, ?, ?)`);
        
        insertItem.run(boissonId, 'THB GM', 'Bière locale Grand Modèle (65cl)', 5000, 1);
        insertItem.run(boissonId, "Ranon'ampango", 'Boisson chaude traditionnelle à base de riz', 1000, 1);
        insertItem.finalize();
    });

    console.log("Les données de test ont été insérées avec succès dans la base de données.");
});

// Fermeture de la connexion après l'exécution du script
setTimeout(() => {
    db.close();
}, 1000);