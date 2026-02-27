require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // La sécurité ne se commente jamais.
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const db = require('./database');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Configuration Proxy (Résout l'erreur express-rate-limit sur Codespaces)
app.set('trust proxy', 1);

// 2. Sécurité des Headers (Adapté pour Local-First et Mobile)
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Désactivé pour le moment pour le proxy Vite
}));

app.use(cors());

// 3. Zero Trust : Limite stricte de la taille des payloads (Prévention DOS)
app.use(express.json({ limit: '50kb' }));

// 4. Rate Limiting Sécurisé
const limiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', limiter);

// ==========================================
// CONFIGURATION DES DOSSIERS SYSTEMES
// ==========================================
const safeDir = global.safeStoragePath || process.cwd();
const uploadDir = path.join(safeDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ==========================================
// ROUTES API
// ==========================================
const authRoutes = require('./routes/authRoutes'); // Nouvel import
const verifyLicense = require('./middlewares/licenseMiddleware');
app.use('/api/auth', authRoutes); // Nouvelle route

app.use('/api/menu', verifyLicense, menuRoutes);
app.use('/api/orders', verifyLicense, orderRoutes);

// ==========================================
// PONT VERS REACT (MODE PRODUCTION ELECTRON/LOCAL)
// ==========================================
let frontendPath = path.join(__dirname, 'frontend/dist');
if (!fs.existsSync(path.join(frontendPath, 'index.html'))) {
    frontendPath = path.join(__dirname, '../frontend/dist');
}

app.use(express.static(frontendPath, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
    }
}));

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