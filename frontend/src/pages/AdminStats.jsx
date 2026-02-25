import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // AJOUT : Le téléporteur
import axios from 'axios';

function AdminStats() {
  const navigate = useNavigate(); // INITIALISATION

  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0 });

  useEffect(() => {
    // Polling toutes les 10 secondes pour les statistiques
    const fetchStats = () => {
      axios.get('/api/orders/stats')
        .then(res => setStats(res.data))
        .catch(err => console.error("Erreur stats:", err));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Rapports & Statistiques</h1>
          <p className="text-slate-500 font-medium mt-1">Suivi des ventes en temps réel</p>
        </div>
        {/* CORRECTION ICI : Utilisation de navigate() */}
        <button 
          onClick={() => navigate('/admin')} 
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          Retour Caisse
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-slate-500 font-bold mb-2 uppercase tracking-wider text-sm">Chiffre d'Affaires Brut</h2>
          <p className="text-5xl font-black text-emerald-600">
            {stats.total_revenue.toLocaleString('fr-FR')} <span className="text-2xl text-emerald-400">Ar</span>
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-slate-500 font-bold mb-2 uppercase tracking-wider text-sm">Commandes Clôturées</h2>
          <p className="text-5xl font-black text-blue-600">
            {stats.total_orders} <span className="text-2xl text-blue-400">tickets</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminStats;
