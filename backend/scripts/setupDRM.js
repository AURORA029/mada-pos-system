const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log("\n===  DÉMARRAGE DU PROTOCOLE DRM (MADA POS) ===\n");

// 1. Génération de la paire de clés RSA
console.log("[1/3] Génération de la paire de clés RSA 2048 bits...");
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

// 2. Injection de la clé publique dans .env
console.log("[2/3] Injection de la clé publique dans backend/.env...");
const envPath = path.join(__dirname, '../.env');
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

// Nettoie l'ancienne clé si elle existe et ajoute la nouvelle formatée
envContent = envContent.replace(/^RSA_PUBLIC_KEY=[\s\S]*?(?=^[A-Z_]+=|$)/gm, '');
// On remplace les sauts de ligne par \n pour que dotenv lise la clé sur une seule ligne
envContent += `\nRSA_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"\n`;
fs.writeFileSync(envPath, envContent);

// 3. Création d'une licence Dev valide (1 an)
console.log("[3/3] Forgeage de la licence de développement...");
const payload = {
    client: "Mada POS - Dev Local",
    tier: "PREMIUM",
    issuedAt: Date.now(),
    expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // + 1 an
};

const signer = crypto.createSign('SHA256');
signer.update(JSON.stringify(payload));
signer.end();
const signature = signer.sign(privateKey, 'base64');

const licensePath = path.join(__dirname, '../mada_pos.lic');
fs.writeFileSync(licensePath, JSON.stringify({ payload, signature }, null, 2));

console.log("\n SUCCÈS : Fichier de licence généré -> mada_pos.lic");
console.log(" SUCCÈS : Clé publique sauvegardée dans .env");

// 4. Remise de la clé privée au CEO
console.log("\n=======================================================");
console.log(" ATTENTION : VOICI TA CLÉ PRIVÉE (MASTER KEY) ");
console.log("Copie-la dans un bloc-notes, Notes Apple, ou un gestionnaire de mots de passe.");
console.log("Elle ne sera PAS sauvegardée dans le code source (Règle Zero Trust).");
console.log("C'est la SEULE clé capable de générer des licences valides à l'avenir.");
console.log("=======================================================\n");
console.log(privateKey);
console.log("=======================================================\n");