 const os = require('os');

// Utilitaire d'auto-découverte de l'IP sur le réseau local (WIFI/Ethernet)
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // On ignore les adresses internes (localhost) et on cherche une IPv4 valide
            if ('IPv4' !== iface.family || iface.internal !== false) {
                continue;
            }
            return iface.address;
        }
    }
    return '127.0.0.1'; // Fallback de sécurité
};

module.exports = { getLocalIP };          