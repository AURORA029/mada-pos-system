import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Ban, CheckCircle } from 'lucide-react';
import { menuService } from '../services/menuService';

function AdminMenu() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category_id: '', image: null
  });
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // ARCHITECTURE RESEAU : S'adapte dynamiquement a l'IP
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${window.location.origin}${cleanPath}`;
  };

  const loadData = async () => {
    try {
      const [cats, menuItems] = await Promise.all([
        menuService.getCategories(),
        menuService.getItems()
      ]);
      
      const safeCats = Array.isArray(cats) ? cats : [];
      const safeItems = Array.isArray(menuItems) ? menuItems : [];
      
      setCategories(safeCats);
      setItems(safeItems);
      
      if (safeCats.length > 0 && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: safeCats[0].id }));
      }
    } catch (err) {
      console.error("Erreur de chargement des donnees:", err);
      setStatusMessage({ type: 'error', text: 'Erreur de connexion au serveur.' });
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setStatusMessage({ type: '', text: '' });
    
    try {
      await menuService.addCategory(newCategoryName);
      setStatusMessage({ type: 'success', text: `Categorie "${newCategoryName}" creee avec succes.` });
      setNewCategoryName('');
      loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erreur lors de la creation de la categorie.";
      setStatusMessage({ type: 'error', text: errorMsg });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!formData.category_id) {
      setStatusMessage({ type: 'error', text: "Vous devez d'abord creer une categorie." });
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category_id', formData.category_id);
    if (formData.image) data.append('image', formData.image);

    try {
      await menuService.addItem(data);
      setStatusMessage({ type: 'success', text: 'Plat ajoute au catalogue.' });
      setFormData(prev => ({ ...prev, name: '', description: '', price: '', image: null }));
      loadData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erreur lors de l'enregistrement du plat.";
      setStatusMessage({ type: 'error', text: errorMsg });
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Etes-vous sur de vouloir retirer "${name}" du menu ? L'historique des ventes sera conserve.`)) {
      return;
    }

    try {
      await menuService.deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
      setStatusMessage({ type: 'success', text: 'Plat retire avec succes.' });
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erreur lors de la suppression.";
      setStatusMessage({ type: 'error', text: errorMsg });
    }
  };

  const handleToggleAvailability = async (item) => {
    const isCurrentlyAvailable = item.is_available === 1 || item.is_available === true || item.is_available === undefined;
    const newStatus = isCurrentlyAvailable ? 0 : 1;

    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newStatus } : i));

    try {
      await menuService.toggleAvailability(item.id, newStatus);
    } catch (err) {
      console.error("Erreur toggle:", err);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: isCurrentlyAvailable ? 1 : 0 } : i));
      setStatusMessage({ type: 'error', text: "Impossible de modifier la disponibilite du plat." });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Gestion du Catalogue</h1>
          <p className="text-slate-500 mt-1">Configurez vos categories et vos plats</p>
        </div>
        <button onClick={() => navigate('/admin')} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-slate-800 transition">
          Retour au Dashboard
        </button>
      </header>

      {statusMessage.text && (
        <div className={`p-4 mb-6 font-bold rounded-lg border ${statusMessage.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="space-y-8 xl:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b">1. Nouvelle Categorie</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="Ex: Boissons froides" required />
              <button type="submit" className="w-full bg-slate-100 text-slate-900 border border-slate-300 py-2 rounded-lg font-bold hover:bg-slate-200 transition">Creer la categorie</button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b">2. Nouveau Plat</h2>
            <form onSubmit={handleSubmitItem} className="space-y-4">
              <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full border border-slate-300 px-3 py-2 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none">
                {categories.length === 0 ? <option value="">Aucune categorie disponible</option> : null}
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="Nom du plat" required />
              <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none" placeholder="Prix (ex: 12500)" required />
              <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none h-24 resize-none" placeholder="Description courte (optionnelle)"></textarea>
              <div className="border border-dashed border-slate-300 p-4 rounded-lg bg-slate-50">
                <label className="block text-sm font-medium text-slate-700 mb-2">Image du plat</label>
                <input type="file" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800" accept="image/*" />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition">Ajouter au catalogue</button>
            </form>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-6 pb-2 border-b">Catalogue Actuel</h2>
          
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
              Votre menu est completement vide.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-sm uppercase text-slate-500">
                    <th className="pb-3 px-2">Image</th>
                    <th className="pb-3 px-2">Nom du plat</th>
                    <th className="pb-3 px-2">Categorie</th>
                    <th className="pb-3 px-2">Prix</th>
                    <th className="pb-3 px-2 text-center">Statut (86)</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(item => {
                    const isAvailable = item.is_available === 1 || item.is_available === true || item.is_available === undefined;
                    const imgUrl = getImageUrl(item.image_url); // Application de la logique réseau
                    
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50 transition ${!isAvailable ? 'opacity-60 bg-slate-50' : ''}`}>
                        <td className="py-3 px-2">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.name} className={`w-12 h-12 rounded object-cover border border-slate-200 ${!isAvailable ? 'grayscale' : ''}`} />
                          ) : (
                            <div className="w-12 h-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-xs text-slate-400">N/A</div>
                          )}
                        </td>
                        <td className={`py-3 px-2 font-medium ${!isAvailable ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                          {item.name}
                        </td>
                        <td className="py-3 px-2 text-slate-600">
                          <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">{item.category_name}</span>
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-900">
                          {Number(item.price || 0).toLocaleString('fr-FR')} Ar
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                              isAvailable 
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                            title={isAvailable ? "Passer en rupture de stock" : "Remettre en disponibilite"}
                          >
                            {isAvailable ? <><CheckCircle size={14} /> Dispo</> : <><Ban size={14} /> Épuisé</>}
                          </button>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <button 
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                            title="Retirer definitivement du menu"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminMenu;