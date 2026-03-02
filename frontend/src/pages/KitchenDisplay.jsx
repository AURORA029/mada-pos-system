import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, ShoppingBag, Utensils, LogOut } from 'lucide-react';
import { orderService } from '../services/orderService';
import { STORAGE_KEYS } from '../utils/constants';

function KitchenDisplay() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingOrders = () => {
    orderService.getAllOrders()
      .then(data => {
        const pending = data.filter(order => order.status === 'en_attente');
        // Tri FIFO (First In, First Out) pour la cuisine
        const sorted = pending.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setOrders(sorted);
        setLoading(false);
      })
      .catch(err => console.error("[KDS] Erreur chargement commandes:", err));
  };

  useEffect(() => {
    fetchPendingOrders();
    const intervalId = setInterval(fetchPendingOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const markAsReady = (id) => {
    orderService.updateStatus(id, 'pret')
      .then(() => fetchPendingOrders())
      .catch(err => alert("Erreur de mise a jour du statut."));
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    navigate('/login');
  };

  if (loading) return <div className="min-h-screen bg-slate-900 text-slate-400 flex items-center justify-center font-bold">Chargement KDS...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-6 font-sans">
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">KDS - Cuisine</h1>
          <p className="text-emerald-400 font-bold text-sm mt-1 animate-pulse flex items-center gap-2">
            <Clock size={16} /> Synchronisation active
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => navigate('/admin')} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 border border-slate-700 transition-colors">
            Retour Caisse
          </button>
          <button onClick={handleLogout} className="bg-red-900/50 text-red-400 px-4 py-2 rounded-lg font-bold hover:bg-red-900 border border-red-800 transition-colors flex items-center gap-2">
            <LogOut size={18}/> Quitter
          </button>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
          <CheckCircle size={64} className="mb-4 opacity-20" />
          <h2 className="text-2xl font-bold">Aucune commande en attente</h2>
          <p className="text-sm mt-2">La brigade est a jour.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.map(order => {
            const isTakeout = order.order_type === 'a_emporter';

            return (
              <div key={order.id} className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
                <div className={`p-4 flex justify-between items-start border-b ${isTakeout ? 'bg-purple-900/30 border-purple-800/50' : 'bg-teal-900/30 border-teal-800/50'}`}>
                  <div>
                    <span className="text-2xl font-black text-white block">#{order.id}</span>
                    <span className="text-lg font-bold text-slate-300 block mt-1">{order.customer_name}</span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isTakeout ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'}`}>
                    {isTakeout ? <ShoppingBag size={14} /> : <Utensils size={14} />}
                    {isTakeout ? 'A Emporter' : 'Sur Place'}
                  </div>
                </div>

                <div className="p-4 flex-grow bg-slate-800">
                  <ul className="space-y-3">
                    {order.items && order.items.map((item, index) => (
                      <li key={index} className="flex justify-between items-center text-slate-200 border-b border-slate-700/50 pb-2 last:border-0">
                        <span className="font-bold text-lg">{item.quantity}x</span>
                        <span className="flex-grow ml-3 text-base font-medium">{item.item_name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-slate-800 border-t border-slate-700">
                  <button 
                    onClick={() => markAsReady(order.id)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 text-lg"
                  >
                    Marquer comme PRET
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default KitchenDisplay;