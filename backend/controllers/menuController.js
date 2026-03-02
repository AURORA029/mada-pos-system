const menuRepo = require('../repositories/menuRepository');

const getCategories = async (req, res) => {
    try {
        const categories = await menuRepo.getAllCategories();
        res.json(categories);
    } catch (err) {
        console.error("[MENU_CTRL_ERROR] Erreur getCategories:", err.message);
        res.status(500).json({ error: "Erreur lors de la recuperation des categories." });
    }
};

const addCategory = async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: "Le nom de la categorie est requis." });
    }

    try {
        const newCategory = await menuRepo.createCategory(name.trim());
        res.status(201).json(newCategory);
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: "Cette categorie existe deja." });
        }
        console.error("[MENU_CTRL_ERROR] Erreur addCategory:", err.message);
        res.status(500).json({ error: "Erreur lors de la creation de la categorie." });
    }
};

const getItems = async (req, res) => {
    try {
        const items = await menuRepo.getActiveItems();
        res.json(items);
    } catch (err) {
        console.error("[MENU_CTRL_ERROR] Erreur getItems:", err.message);
        res.status(500).json({ error: "Erreur lors de la recuperation du menu." });
    }
};

const addItem = async (req, res) => {
    const { category_id, name, description, price } = req.body;
    
    if (!name || !price || !category_id) {
        return res.status(400).json({ error: "Les champs obligatoires (nom, prix, categorie) sont manquants." });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const itemData = {
            category_id: parseInt(category_id, 10),
            name: name.trim(),
            description: description ? description.trim() : null,
            price: parseFloat(price),
            imageUrl
        };

        const itemId = await menuRepo.createItem(itemData);
        res.status(201).json({ 
            success: true, 
            item_id: itemId, 
            message: "Plat ajoute avec succes au catalogue." 
        });
    } catch (err) {
        console.error("[MENU_CTRL_ERROR] Erreur addItem:", err.message);
        res.status(500).json({ error: "Erreur lors de l'enregistrement du plat." });
    }
};

const deleteItem = async (req, res) => {
    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID du plat invalide." });
    }

    try {
        const changes = await menuRepo.softDeleteItem(parseInt(id, 10));
        if (changes === 0) {
            return res.status(404).json({ error: "Plat introuvable ou deja supprime." });
        }
        res.json({ success: true, message: "Le plat a ete retire du menu." });
    } catch (err) {
        console.error("[MENU_CTRL_ERROR] Erreur deleteItem:", err.message);
        res.status(500).json({ error: "Erreur lors de la suppression du plat." });
    }
};

const toggleAvailability = async (req, res) => {
    const { id } = req.params;
    const { is_available } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({ error: "ID du plat invalide." });
    }

    if (is_available === undefined) {
        return res.status(400).json({ error: "Le statut de disponibilite est requis." });
    }

    // Cast propre en entier (0 ou 1) pour SQLite, Zero Trust sur l'input
    const availabilityInt = is_available === true || is_available === '1' || is_available === 1 ? 1 : 0;

    try {
        const changes = await menuRepo.updateItemAvailability(parseInt(id, 10), availabilityInt);
        if (changes === 0) {
            return res.status(404).json({ error: "Plat introuvable ou supprime." });
        }
        res.json({ 
            success: true, 
            message: availabilityInt === 1 ? "Plat disponible." : "Plat en rupture.",
            is_available: availabilityInt 
        });
    } catch (err) {
        console.error("[MENU_CTRL_ERROR] Erreur toggleAvailability:", err.message);
        res.status(500).json({ error: "Erreur lors de la mise a jour de la disponibilite." });
    }
};

module.exports = {
    getCategories,
    addCategory,
    getItems,
    addItem,
    deleteItem,
    toggleAvailability
};