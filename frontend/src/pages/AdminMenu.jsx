import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AdminMenu() {
  const navigate = useNavigate();

  // --- ÉTATS ---
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category_id: '', image: null
  });
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // --- CHARGEMENT ---
  const fetchCategories = () => {
    axios.get('/api/menu/categories')
      .then(res => {
        setCategories(res.data);
        if (res.data.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
        }
      })
      .catch(err => console.error("Erreur catégories:", err));
  };

  useEffect(() => { fetchCategories(); }, []);

  // --- LOGIQUE CATÉGORIE ---
  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    axios.post('/api/menu/categories', { name: newCategoryName })
      .then(() => {
        setStatusMessage({ type: 'success', text: `Catégorie "${newCategoryName}" créée !` });
        setNewCategoryName('');
        fetchCategories();
      })
      .catch(() => setStatusMessage({ type: 'error', text: "Erreur création catégorie." }));
  };

  // --- LOGIQUE PLAT ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.category_id) {
      setStatusMessage({ type: 'error', text: "Créez d'abord une catégorie !" });
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category_id', formData.category_id);
    if (formData.image) data.append('image', formData.image);

    axios.post('/api/menu/items', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(() => {
      setStatusMessage({ type: 'success', text: 'Plat ajouté avec succès !' });
      setFormData(prev => ({ ...prev, name: '', description: '', price: '', image: null }));
    })
    .catch(() => setStatusMessage({ type: 'error', text: "Erreur enregistrement plat." }));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Catalogue Admin</h1>
        <button onClick={() => navigate('/admin')} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold">Retour</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BLOC 1 : CRÉER UNE CATÉGORIE (VITAL) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="font-bold mb-4">1. Créer une Catégorie</h2>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full border p-2 rounded" placeholder="Ex: Boissons" />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold">Ajouter</button>
          </form>
        </div>

        {/* BLOC 2 : CRÉER UN PLAT */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
          <h2 className="font-bold mb-4">2. Ajouter un Plat</h2>
          {statusMessage.text && <div className="p-3 mb-4 bg-blue-50 text-blue-800 font-bold rounded">{statusMessage.text}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border p-2 rounded" placeholder="Nom du plat" required />
            <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full border p-2 rounded bg-white">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full border p-2 rounded" placeholder="Prix" required />
            <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full border p-2 rounded" placeholder="Description"></textarea>
            <input type="file" onChange={handleFileChange} className="w-full border p-2 rounded" />
            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded font-bold">Enregistrer le plat</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminMenu;
