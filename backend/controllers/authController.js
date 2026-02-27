const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const settingsRepo = require('../repositories/settingsRepository');
const networkUtils = require('../utils/network');

const login = async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Le mot de passe est requis." });
    }

    try {
        // Remplacement de l'appel SQL direct par le Repository (SRP)
        const adminPasswordHash = await settingsRepo.getSetting('admin_password');

        if (!adminPasswordHash) {
            return res.status(500).json({ error: "Configuration systeme critique manquante." });
        }

        // Verification cryptographique Zero Trust
        const isValid = bcrypt.compareSync(password, adminPasswordHash);

        if (!isValid) {
            return res.status(401).json({ error: "Mot de passe incorrect." });
        }

        // Generation du JWT (Valable 12 heures)
        const token = jwt.sign(
            { role: 'admin' }, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' }
        );

        res.json({ message: "Authentification reussie", token });
    } catch (err) {
        console.error("[Auth Error]:", err);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
};
const checkSetupStatus = async (req, res) => {
    try {
        const adminPasswordHash = await settingsRepo.getSetting('admin_password');
        const isConfigured = !!adminPasswordHash;
        
        // Recuperation de l'IP locale pour l'affichage dans le Wizard
        const localIp = networkUtils.getLocalIP ? networkUtils.getLocalIP() : 'Non disponible';

        res.json({ isConfigured, localIp });
    } catch (err) {
        console.error("[Setup Status Error]:", err);
        res.status(500).json({ error: "Erreur lors de la verification du statut du systeme." });
    }
};

const initialSetup = async (req, res) => {
    const { restaurantName, password } = req.body;

    if (!restaurantName || !password) {
        return res.status(400).json({ error: "Le nom du restaurant et le mot de passe sont requis." });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caracteres." });
    }

    try {
        // VERROUILLAGE ZERO TRUST : Verification prealable
        const existingPassword = await settingsRepo.getSetting('admin_password');
        if (existingPassword) {
            console.warn("[SECURITY] Tentative de reconfiguration bloquee.");
            return res.status(403).json({ error: "Le systeme est deja configure. Acces refuse." });
        }

        // Hashage du mot de passe
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        // Sauvegarde via Repository (Assure-toi que la methode s'appelle bien setSetting ou adapte-la)
        await settingsRepo.setSetting('admin_password', hashedPassword);
        await settingsRepo.setSetting('restaurant_name', restaurantName);

        res.status(201).json({ message: "Configuration initiale terminee avec succes." });
    } catch (err) {
        console.error("[Setup Error]:", err);
        res.status(500).json({ error: "Erreur lors de la configuration initiale." });
    }
};

module.exports = { login, checkSetupStatus, initialSetup };