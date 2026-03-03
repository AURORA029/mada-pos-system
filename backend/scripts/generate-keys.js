const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, 'keys');

function generateKeypair() {
    console.log("[SYSTEM] Demarrage de la generation de la paire de cles RSA...");

    if (!fs.existsSync(KEYS_DIR)) {
        fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    const privateKeyPath = path.join(KEYS_DIR, 'private.pem');
    const publicKeyPath = path.join(KEYS_DIR, 'public.pem');

    if (fs.existsSync(privateKeyPath) || fs.existsSync(publicKeyPath)) {
        console.error("[ERREUR_CRITIQUE] Des cles existent deja dans le dossier keys/ !");
        console.error("Supprimez-les manuellement si vous voulez vraiment reinitialiser le systeme.");
        process.exit(1);
    }

    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    fs.writeFileSync(privateKeyPath, privateKey);
    fs.writeFileSync(publicKeyPath, publicKey);

    console.log("[SUCCES] Paire de cles RSA-2048 generee avec succes !");
    console.log(`Cle Privee (GARDER SECRET) : ${privateKeyPath}`);
    console.log(`Cle Publique (A INTEGRER A L'APP) : ${publicKeyPath}`);
}

generateKeypair();