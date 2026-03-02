const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const menuController = require('../controllers/menuController');

// ==========================================
// CONFIGURATION MULTER (Uploads d'images)
// ==========================================
const baseDir = global.safeStoragePath || process.cwd();
const uploadDir = path.join(baseDir, 'uploads'); 

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==========================================
// ROUTES API MENU (Clean Architecture)
// ==========================================

// Categories
router.get('/categories', menuController.getCategories);
router.post('/categories', menuController.addCategory);

// Plats (Items)
router.get('/items', menuController.getItems);
router.post('/items', upload.single('image'), menuController.addItem);

// Mises a jour partielles (Disponibilite)
router.patch('/items/:id/availability', menuController.toggleAvailability);

// Soft Delete
router.delete('/items/:id', menuController.deleteItem);

module.exports = router;