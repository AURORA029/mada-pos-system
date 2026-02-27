const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const verifyLicense = (req, res, next) => {
    try {
        const safeDir = global.safeStoragePath || process.cwd();
        const licensePath = path.join(safeDir, 'mada_pos.lic');

        // 1. Vérification de l'existence
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

        // 3. Vérification de la clé publique
        const publicKey = process.env.RSA_PUBLIC_KEY;
        if (!publicKey) {
            console.error("[CRITICAL] RSA_PUBLIC_KEY manquante dans le fichier .env");
            return res.status(500).json({ 
                error: 'SYSTEM_CONFIG_ERROR', 
                message: 'Erreur de configuration de sécurité du serveur.' 
            });
        }

        // 4. Validation Cryptographique
        const verifier = crypto.createVerify('SHA256');
        // AVERTISSEMENT: La stringification doit correspondre exactement au payload original
        verifier.update(JSON.stringify(license.payload));
        verifier.end();

        const isValid = verifier.verify(publicKey, license.signature, 'base64');

        if (!isValid) {
            return res.status(403).json({ 
                error: 'LICENSE_INVALID', 
                message: 'Signature de licence frauduleuse détectée.' 
            });
        }

        // 5. Vérification de la date d'expiration (Si applicable)
        if (license.payload.expiresAt && Date.now() > license.payload.expiresAt) {
            return res.status(403).json({ 
                error: 'LICENSE_EXPIRED', 
                message: 'Votre licence a expiré.' 
            });
        }

        // 6. Injection des données de licence pour un usage ultérieur (optionnel)
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