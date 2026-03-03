const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const settingsRepo = require('../repositories/settingsRepository');
const networkUtils = require('../utils/network');
const paymentRepo = require('../repositories/paymentRepository');

const login = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Le mot de passe est requis." });
    }

    try {
        const adminPasswordHash = await settingsRepo.getSetting('admin_password');

        if (!adminPasswordHash) {
            console.error("[AUTH_CRITICAL]: Aucun mot de passe admin configuré en base.");
            return res.status(500).json({ error: "Configuration système critique manquante. Refaites le setup." });
        }

        const isValid = bcrypt.compareSync(password, adminPasswordHash);

        if (!isValid) {
            return res.status(401).json({ error: "Mot de passe incorrect." });
        }

        // SÉCURITÉ : Vérification du Secret JWT
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("[AUTH_FATAL]: JWT_SECRET est manquant dans le fichier .env !");
            return res.status(500).json({ error: "Erreur de configuration serveur (Secret manquant)." });
        }

        const token = jwt.sign(
            { role: 'admin' }, 
            secret, 
            { expiresIn: '12h' }
        );

        res.json({ message: "Authentification réussie", token });
    } catch (err) {
        console.error("[Auth Error]:", err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};

const checkSetupStatus = async (req, res) => {
    try {
        const adminPasswordHash = await settingsRepo.getSetting('admin_password');
        const isConfigured = !!adminPasswordHash;
        const localIp = networkUtils.getLocalIP ? networkUtils.getLocalIP() : 'Non disponible';

        res.json({ isConfigured, localIp });
    } catch (err) {
        console.error("[Setup Status Error]:", err);
        res.status(500).json({ isConfigured: false, error: "Erreur de vérification." });
    }
};

// ON NE GARDE QU'UNE SEULE DÉCLARATION DE initialSetup
const initialSetup = async (req, res) => {
    const { restaurantName, password } = req.body;

    if (!restaurantName || !password) {
        return res.status(400).json({ error: "Données incomplètes." });
    }

    try {
        const existingPassword = await settingsRepo.getSetting('admin_password');
        
        if (existingPassword && existingPassword.length > 10) {
            return res.status(403).json({ error: "Le système est déjà configuré." });
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        await settingsRepo.setSetting('admin_password', hashedPassword);
        await settingsRepo.setSetting('restaurant_name', restaurantName);

        // --- 2. LA FRAPPE CHIRURGICALE : NETTOYAGE DU SEED ---
        await paymentRepo.deleteInitMethods();

        res.status(201).json({ message: "Configuration terminée." });
    } catch (err) {
        console.error("[Setup Error]:", err);
        res.status(500).json({ error: "Erreur lors de la configuration." });
    }
};

module.exports = { login, checkSetupStatus, initialSetup };