const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ==========================================
// CACHE MÉMOIRE (ANTI-I/O BLOCKING)
// On stocke la clé en RAM pour ne pas saturer le disque dur à chaque commande
// ==========================================
let cachedPublicKey = null;

const verifyLicense = (req, res, next) => {
    try {
        const safeDir = global.safeStoragePath || process.cwd();
        const licensePath = path.join(safeDir, 'mada_pos.lic');

        // 1. Vérification de l'existence de la licence
        if (!fs.existsSync(licensePath)) {
            return res.status(403).json({ 
                error: 'LICENSE_MISSING', 
                message: 'Aucune licence trouvée. Le système est verrouillé.' 
            });
        }

        // 2. Lecture et Parsing
        const rawData = fs.readFileSync(licensePath, 'utf8');
        const license = JSON.parse(rawData);

        if (!license.payload || !license.signature) {
            return res.status(403).json({ 
                error: 'LICENSE_CORRUPTED', 
                message: 'Le fichier de licence est corrompu.' 
            });
        }

        // 3. Lecture de la Clé Publique (AVEC CACHE HAUTE PERFORMANCE)
        if (!cachedPublicKey) {
            const publicKeyPath = path.join(__dirname, '..', 'public.pem');
            
            if (!fs.existsSync(publicKeyPath)) {
                console.error("[CRITICAL] Fichier public.pem introuvable à la racine du backend !");
                return res.status(500).json({ 
                    error: 'SYSTEM_CONFIG_ERROR', 
                    message: 'Erreur de configuration de sécurité du serveur.' 
                });
            }
            // On lit le disque une seule fois, puis on le garde en mémoire
            cachedPublicKey = fs.readFileSync(publicKeyPath, 'utf8');
            console.log("[DRM_SYS] Clé publique RSA chargée en mémoire cache avec succès.");
        }

        // 4. Validation Cryptographique RSA-256
        const verifier = crypto.createVerify('SHA256');
        verifier.update(JSON.stringify(license.payload));
        verifier.end();

        const isValid = verifier.verify(cachedPublicKey, license.signature, 'base64');

        if (!isValid) {
            return res.status(403).json({ 
                error: 'LICENSE_INVALID', 
                message: 'Signature de licence frauduleuse détectée.' 
            });
        }

        // 5. Vérification de la date d'expiration
        if (license.payload.expiresAt) {
            const expirationDate = new Date(license.payload.expiresAt).getTime();
            if (Date.now() > expirationDate) {
                return res.status(403).json({ 
                    error: 'LICENSE_EXPIRED', 
                    message: 'Votre licence a expiré.' 
                });
            }
        }

        // 6. Injection des données de licence
        req.license = license.payload;
        next();

    } catch (error) {
        console.error("[SECURITY] Erreur middleware licence :", error.message);
        return res.status(403).json({ 
            error: 'LICENSE_ERROR', 
            message: 'Erreur lors de la validation du DRM.' 
        });
    }
};

module.exports = verifyLicense;