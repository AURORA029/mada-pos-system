const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const db = require('./database');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Modification de Helmet pour autoriser le chargement des images en local
app.use(helmet({ crossOriginResourcePolicy: false }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "Trop de requêtes, veuillez réessayer plus tard."
});
app.use('/api', limiter);

app.use(cors());
app.use(express.json());

// Déclaration du dossier 'uploads' comme dossier statique public
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


// Branchement des routes API
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/status', (req, res) => {
    res.json({ statut: "En ligne", timestamp: new Date().toISOString() });
});

// ==========================================
// LE PONT VERS REACT (VERSION ROBUSTE)
// ==========================================

// On définit le chemin de l'interface en testant deux emplacements : 
// 1. Le mode PROD (fichiers aplatis dans l'archive)
// 2. Le mode DEV (fichiers dans ../frontend/dist)
let frontendPath = path.join(__dirname, 'frontend/dist');

if (!require('fs').existsSync(path.join(frontendPath, 'index.html'))) {
    frontendPath = path.join(__dirname, '../frontend/dist');
}

console.log("Recherche de l'interface dans :", frontendPath);

app.use(express.static(frontendPath));

// Le "Catch-all" : On renvoie l'index.html pour toutes les routes web
app.get('*', (req, res) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("Erreur Critique : Le fichier index.html est introuvable dans le logiciel.");
    }
});


app.listen(PORT, () => {
    console.log(`Serveur Mada POS demarre sur le port ${PORT}`);
});
