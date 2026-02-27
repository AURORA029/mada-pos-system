const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    // 1. Récupération du header d'autorisation
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            error: "Accès refusé. Token manquant ou mal formaté." 
        });
    }

    // 2. Extraction du token (suppression de "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 3. Vérification cryptographique
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Injection des données utilisateur dans la requête (pour les contrôleurs suivants)
        req.user = decoded;
        
        // 5. Passage au middleware/contrôleur suivant
        next();
    } catch (error) {
        // Gestion propre des erreurs (Expiration, falsification) sans crasher le serveur
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Session expirée. Veuillez vous reconnecter." });
        }
        return res.status(403).json({ error: "Token invalide ou corrompu." });
    }
};

module.exports = { requireAuth };