const express = require('express');
const cors = require('cors');
// const helmet = require('helmet'); // <--- DÉSACTIVÉ POUR LE TEST MOBILE
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const db = require('./database');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = 5000;

// app.use(helmet({ crossOriginResourcePolicy: false })); // <--- DÉSACTIVÉ ICI AUSSI
app.use(cors());
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);

// Gestion des images dans le dossier sécurisé de Windows
const safeDir = global.safeStoragePath || process.cwd();
const uploadDir = path.join(safeDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Routes API
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/status', (req, res) => {
    res.json({ statut: "En ligne", timestamp: new Date().toISOString() });
});

// ==========================================
// PONT VERS REACT (VERSION ULTRA-STABLE & MULTI-APPAREILS)
// ==========================================
let frontendPath = path.join(__dirname, 'frontend/dist');
if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
    frontendPath = path.join(__dirname, '../frontend/dist');
}

// 1. Distribution des fichiers avec forçage des types MIME pour iPhone/iPad
app.use(express.static(frontendPath, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    }
}));

// 2. Gestionnaire de secours (Catch-all) immunisé contre l'écran blanc
app.use((req, res) => {
    if (req.path.includes('.') && !req.path.endsWith('.html')) {
        return res.status(404).send("Ressource introuvable");
    }

    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Erreur : Interface React introuvable.");
    }
});

const server = app.listen(PORT, '0.0.0.0', () => { 
    console.log(`=== SUCCÈS : Serveur Mada POS à l'écoute sur le port ${PORT} ===`);
});

server.on('error', (err) => {
    console.error("ERREUR CRITIQUE DU SERVEUR :", err);
});
