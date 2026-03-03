const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==========================================
// 🚀 ZONE DE SÉCURITÉ (ACCÈS EN ÉCRITURE)
// ==========================================
// On définit le dossier sécurisé DÈS LE DÉBUT pour qu'il serve à tout le fichier
const safeDir = global.safeStoragePath || process.cwd();

// ==========================================
// 🚀 AUTO-PROVISIONING (ZERO-TOUCH SETUP)
// ==========================================
// Le .env est maintenant stocké dans AppData, loin de Program Files
const envPath = path.join(safeDir, '.env');

// 1. Création propre si le fichier n'existe pas du tout
if (!fs.existsSync(envPath)) {
    console.log(`[AUTO-PROVISIONING] Fichier .env manquant. Création native dans : ${safeDir}`);
    fs.writeFileSync(envPath, "# Configuration auto-générée MADA POS\n", { encoding: 'utf8' });
}

// 2. Chargement des variables existantes
require('dotenv').config({ path: envPath });

// 3. Génération dynamique du JWT_SECRET s'il est absent
if (!process.env.JWT_SECRET) {
    console.log("[AUTO-PROVISIONING] Aucun JWT_SECRET détecté. Génération cryptographique...");
    // Génère une chaîne aléatoire de 64 caractères très sécurisée
    const newSecret = crypto.randomBytes(32).toString('hex'); 
    
    // Écrit le secret dans le fichier pour les prochains démarrages
    fs.appendFileSync(envPath, `JWT_SECRET=${newSecret}\n`, { encoding: 'utf8' });
    
    // Injecte le secret "à chaud" dans la mémoire du serveur pour éviter un redémarrage
    process.env.JWT_SECRET = newSecret; 
    console.log("[AUTO-PROVISIONING] JWT_SECRET généré et sauvegardé avec succès dans AppData.");
}

// ==========================================
// SUITE DU CODE NORMAL
// ==========================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// --- DEBUG SYSTEME ---
console.log("============================================");
console.log(`[DEBUG_ENV] Fichier .env détecté ? : ${fs.existsSync(envPath)}`);
console.log(`[DEBUG_ENV] Chemin du .env : ${envPath}`);
console.log(`[DEBUG_ENV] JWT_SECRET chargé : OUI (Longueur : ${process.env.JWT_SECRET.length})`);
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

// Dossier Uploads sécurisé (réutilise le safeDir de la ligne 10)
const uploadDir = path.join(safeDir, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// --- 1. ROUTES PUBLIQUES (NON-METIER) ---
app.use('/api/auth', authRoutes); 
app.use('/api/settings', settingsRoutes);
app.use('/api/system', systemRoutes); 

// --- 2. ROUTES PROTEGÉES (DRM STRICT SUR TOUT LE BUSINESS) ---
app.use('/api/menu', verifyLicense, menuRoutes);
app.use('/api/orders', verifyLicense, orderRoutes);
app.use('/api/payments', verifyLicense, paymentRoutes); 
app.use('/api/closings', verifyLicense, closingRoutes); 
app.use('/api/backup', verifyLicense, backupRoutes);    
app.use('/api/stats', verifyLicense, statsRoutes);      

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