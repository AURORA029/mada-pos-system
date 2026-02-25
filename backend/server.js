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
// LE PONT VERS REACT (À AJOUTER ICI)
// ==========================================
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Le "Catch-all" : Si on ne demande pas une API, on affiche l'interface React
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});
// ==========================================

app.listen(PORT, () => {
    console.log(`Serveur Mada POS demarre sur le port ${PORT}`);
});
