const uploadLicense = (req, res) => {
    try {
        // Multer a déjà fait le travail de vérification et de sauvegarde physique.
        // Si on arrive ici sans req.file, c'est que le fichier a été rejeté.
        if (!req.file) {
            console.warn("[DRM_WARNING]: Tentative d'upload échouée (Format invalide ou fichier manquant).");
            return res.status(400).json({ 
                success: false, 
                message: "Format de fichier non autorisé ou upload corrompu." 
            });
        }

        console.log("[DRM_SYSTEM]: Nouvelle licence physique réceptionnée et écrasée avec succès.");
        
        // On renvoie un 200 OK clair pour déclencher le window.location.reload() du Frontend
        return res.status(200).json({ 
            success: true, 
            message: "Licence validée et installée." 
        });

    } catch (error) {
        console.error("[DRM_FATAL_ERROR]: Crash lors du traitement de la licence :", error);
        return res.status(500).json({ 
            success: false, 
            message: "Erreur interne du serveur lors de la sauvegarde." 
        });
    }
};

module.exports = {
    uploadLicense
};