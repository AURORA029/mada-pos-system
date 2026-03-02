const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const systemController = require('../controllers/systemController');

const baseDir = global.safeStoragePath || process.cwd();

// Configuration Zero Trust de l'upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, baseDir); // On sauvegarde à la racine (là où le middleware cherche)
    },
    filename: function (req, file, cb) {
        // OVERRIDE STRICT : Quel que soit le nom du fichier envoyé, il devient mada_pos.lic
        cb(null, 'mada_pos.lic');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Sécurité : On bloque l'upload de scripts malveillants (.php, .js)
        if (path.extname(file.originalname).toLowerCase() !== '.lic') {
            return cb(new Error('Format de fichier non autorisé.'));
        }
        cb(null, true);
    }
});

// Route PUBLIQUE pour uploader la licence
router.post('/license', upload.single('licenseFile'), systemController.uploadLicense);

module.exports = router;