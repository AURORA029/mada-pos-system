import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // AJOUT : Le téléporteur
import axios from 'axios';

function AdminMenu() {
  const navigate = useNavigate(); // INITIALISATION

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image: null
  });
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Récupération des catégories pour le menu déroulant
    axios.get('/api/menu/categories')
      .then(res => {
        setCategories(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, category_id: res.data[0].id }));
        }
      })
      .catch(err => console.error("Erreur catégories:", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage({ type: 'info', text: 'Enregistrement en cours...' });

    // Utilisation de FormData pour envoyer un fichier physique
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category_id', formData.category_id);
    if (formData.image) {
      data.append('image', formData.image);
    }

    axios.post('/api/menu/items', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(() => {
      setStatusMessage({ type: 'success', text: 'Plat ajouté au catalogue avec succès !' });
      // Réinitialisation du formulaire
      setFormData(prev => ({ ...prev, name: '', description: '', price: '', image: null }));
      document.getElementById('imageInput').value = ''; // Reset de l'input file
    })
    .catch(err => {
      console.error("Erreur d'ajout:", err);
      setStatusMessage({ type: 'error', text: "Erreur lors de l'enregistrement." });
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Catalogue / Administration</h1>
          <p className="text-slate-500 font-medium mt-1">Ajouter un nouveau plat au menu</p>
        </div>
        {/* AJOUT ICI : Le bouton de retour pour ne pas rester bloqué */}
        <button 
          onClick={() => navigate('/admin')} 
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors"
        >
          Retour Caisse
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
        {statusMessage.text && (
          <div className={`p-4 mb-6 rounded-lg font-bold ${statusMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : statusMessage.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nom du plat</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-900 outline-none" placeholder="Ex: Poulet au coco" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Catégorie</label>
            <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full border border-slate-300 rounded-lg p-3 bg-white outline-none">
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Prix (en Ariary)</label>
            <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" className="w-full border border-slate-300 rounded-lg p-3 outline-none" placeholder="Ex: 12000" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optionnelle)</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full border border-slate-300 rounded-lg p-3 outline-none" placeholder="Ingrédients, cuisson..."></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Photographie du plat</label>
            <input type="file" id="imageInput" accept="image/*" onChange={handleFileChange} className="w-full border border-slate-300 rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100" />
          </div>

          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl mt-4 transition-colors">
            Enregistrer le plat
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminMenu;
