require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// --- DEBUG SYSTEME (MASTER DEV) ---
console.log("============================================");
console.log("[DEBUG_PATH] Répertoire courant (cwd) :", process.cwd());
console.log("[DEBUG_PATH] Chemin attendu du .env :", path.join(process.cwd(), '.env'));
console.log("[DEBUG_ENV] Fichier .env détecté ? :", fs.existsSync(path.join(process.cwd(), '.env')));
if (process.env.JWT_SECRET) {
    console.log("[DEBUG_ENV] JWT_SECRET chargé : OUI (Longueur : " + process.env.JWT_SECRET.length + ")");
} else {
    console.error("[DEBUG_ENV] JWT_SECRET chargé : NON");
}
console.log("============================================");
const db = require('./database');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes'); 
const settingsRoutes = require('./routes/settingsRoutes'); 
const systemRoutes = require('./routes/systemRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const closingRoutes = require('./routes/closingRoutes'); 
const backupRoutes = require('./routes/backupRoutes');
const statsRoutes = require('./routes/statsRoutes');

// LE VIGILE
const verifyLicense = require('./middlewares/licenseMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

app.use(cors());
app.use(express.json({ limit: '50kb' }));

const limiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', limiter);

const safeDir = global.safeStoragePath || process.cwd();
const uploadDir = path.join(safeDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ==========================================
// ROUTES API - ARCHITECTURE ZERO TRUST
// ==========================================

// --- 1. ROUTES PUBLIQUES (NON-METIER) ---
app.use('/api/auth', authRoutes); 
app.use('/api/settings', settingsRoutes);
app.use('/api/system', systemRoutes); // Porte de secours pour uploader le .lic depuis le Front

// --- 2. ROUTES PROTEGÉES (DRM STRICT SUR TOUT LE BUSINESS) ---
app.use('/api/menu', verifyLicense, menuRoutes);
app.use('/api/orders', verifyLicense, orderRoutes);
app.use('/api/payments', verifyLicense, paymentRoutes); // VERROUILLÉ
app.use('/api/closings', verifyLicense, closingRoutes); // VERROUILLÉ
app.use('/api/backup', verifyLicense, backupRoutes);    // VERROUILLÉ
app.use('/api/stats', verifyLicense, statsRoutes);      // VERROUILLÉ

// ==========================================
// PONT VERS REACT
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
