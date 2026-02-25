// ==========================================
// MADA POS SYSTEM - Routes de l'API Menu
// Fichier : backend/routes/menuRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const db = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// process.cwd() pointe vers le dossier AppData (autorisé en écriture)
const uploadDir = path.join(process.cwd(), 'uploads'); 

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// Configuration du moteur de stockage Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Les fichiers iront dans backend/uploads/
    },
    filename: function (req, file, cb) {
        // Génération d'un nom unique pour éviter d'écraser des fichiers existants
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 1. Récupérer toutes les catégories
router.get('/categories', (req, res) => {
    const query = `SELECT * FROM categories`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        res.json(rows);
    });
});

// 2. Ajouter une nouvelle catégorie
router.post('/categories', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Le nom de la catégorie est requis." });

    const query = `INSERT INTO categories (name) VALUES (?)`;
    db.run(query, [name], function(err) {
        if (err) return res.status(500).json({ error: "Erreur de création." });
        res.status(201).json({ id: this.lastID, name: name });
    });
});

// 3. Récupérer tous les plats du menu
router.get('/items', (req, res) => {
    const query = `
        SELECT menu_items.*, categories.name as category_name 
        FROM menu_items 
        LEFT JOIN categories ON menu_items.category_id = categories.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur serveur." });
        res.json(rows);
    });
});

// 4. Ajouter un nouveau plat avec son image
// Le middleware upload.single('image') intercepte le fichier envoyé par le Frontend
router.post('/items', upload.single('image'), (req, res) => {
    const { category_id, name, description, price } = req.body;
    
    // Si un fichier est présent, on génère son URL publique, sinon null
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !price || !category_id) {
        return res.status(400).json({ error: "Les champs obligatoires sont manquants." });
    }

    const query = `INSERT INTO menu_items (category_id, name, description, price, image_url, is_available) VALUES (?, ?, ?, ?, ?, 1)`;
    
    db.run(query, [category_id, name, description, price, imageUrl], function(err) {
        if (err) {
            console.error("Erreur SQL:", err.message);
            return res.status(500).json({ error: "Erreur lors de l'enregistrement du plat." });
        }
        res.status(201).json({ 
            success: true, 
            item_id: this.lastID, 
            message: "Plat ajouté avec succès au catalogue." 
        });
    });
});

module.exports = router;
