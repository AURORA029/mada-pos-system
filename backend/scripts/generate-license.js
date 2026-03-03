const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRIVATE_KEY_PATH = path.join(__dirname, 'keys', 'private.pem');
const OUTPUT_LICENSE_PATH = path.join(__dirname, '..', 'mada_pos.lic');

function generateLicense() {
    console.log("[SYSTEM] Preparation de la licence MADA POS...");

    if (!fs.existsSync(PRIVATE_KEY_PATH)) {
        console.error("[ERREUR_CRITIQUE] Cle privee introuvable ! Executez generate-keys.js d'abord.");
        process.exit(1);
    }

    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

    // CONTRAT DE DONNEES DE LA LICENCE
    const licenseData = {
        clientName: "Restaurant Le Mada",
        hardwareId: "ANY", // Pour plus tard : lier a l'adresse MAC
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(), // +1 an
        features: ["core", "export", "kds"]
    };

    const payloadString = JSON.stringify(licenseData);

    // SIGNATURE RSA AVEC SHA-256
    const sign = crypto.createSign('SHA256');
    sign.update(payloadString);
    sign.end();

    const signature = sign.sign(privateKey, 'base64');

    // CREATION DU FICHIER DE LICENCE FINAL
    const licenseFileContent = {
        payload: licenseData,
        signature: signature
    };

    fs.writeFileSync(OUTPUT_LICENSE_PATH, JSON.stringify(licenseFileContent, null, 2));

    console.log("[SUCCES] Licence generee et signee avec succes !");
    console.log(`Fichier cree : ${OUTPUT_LICENSE_PATH}`);
    console.log("Expiration :", licenseData.expiresAt);
}

generateLicense();