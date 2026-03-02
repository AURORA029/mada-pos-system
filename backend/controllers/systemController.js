const uploadLicense = (req, res) => {
    // Zero Trust : Si Multer a rejeté le fichier (mauvaise extension) ou s'il n'y en a pas
    if (!req.file) {
        return res.status(400).json({ 
            error: "UPLOAD_FAILED", 
            message: "Aucun fichier fourni ou format invalide. Seuls les .lic sont acceptés." 
        });
    }

    // Le fichier a été écrasé physiquement par Multer au bon endroit
    console.log("[SYSTEM] Nouvelle licence uploadée avec succès.");
    
    res.json({ 
        success: true, 
        message: "Licence mise à jour avec succès. Le système peut être déverrouillé." 
    });
};

module.exports = {
    uploadLicense
};