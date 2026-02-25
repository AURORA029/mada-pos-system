import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // AJOUT CRITIQUE : Le téléporteur React
import axios from 'axios';

function AdminDashboard() {
  const navigate = useNavigate(); // INITIALISATION DU TÉLÉPORTEUR

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    axios.get('/api/orders')
      .then(response => {
        setOrders(response.data);
        setLoading(false);
      })
      .catch(err => console.error("Erreur chargement:", err));
  };

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const updateOrderStatus = (id, newStatus) => {
    axios.put(`/api/orders/${id}/status`, { status: newStatus })
      .then(() => fetchOrders())
      .catch(err => alert("Erreur de mise à jour."));
  };

  const activeOrders = orders.filter(order => order.status !== 'paye');

  // Fonction d'impression native du navigateur
  const printTicket = (order) => {
    // Injecte temporairement les données de la commande dans la zone d'impression
    document.getElementById('print-order-id').innerText = order.id;
    document.getElementById('print-customer').innerText = order.customer_name;
    document.getElementById('print-total').innerText = order.total_amount.toLocaleString('fr-FR') + ' Ar';
    document.getElementById('print-date').innerText = new Date().toLocaleString('fr-FR');
    
    // Déclenche la fenêtre d'impression
    window.print();
  };

  if (loading) return <div className="p-8 text-center font-bold">Chargement...</div>;

  return (
    <>
      {/* --- ZONE D'INTERFACE NORMALE (Masquée à l'impression) --- */}
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:hidden">
        <header className="mb-8 flex justify-between items-start md:items-end flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Caisse / Dashboard</h1>
            <p className="text-slate-500 font-medium mt-1 animate-pulse">Actualisation en temps réel</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* CORRECTIONS ICI : Utilisation de navigate() au lieu de window.location.href */}
            <button 
              onClick={() => navigate('/admin/stats')} 
              className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold hover:bg-blue-200"
            >
              Statistiques
            </button>
            <button 
              onClick={() => navigate('/admin/menu')} 
              className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800"
            >
              Menu
            </button>
            <button 
              onClick={() => { 
                localStorage.removeItem('mada_pos_auth'); 
                navigate('/login'); 
              }} 
              className="border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50"
            >
              Verrouiller
            </button>
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50"><h2 className="text-xl font-bold">Commandes en cours ({activeOrders.length})</h2></div>
          <div className="divide-y divide-slate-100">
            {activeOrders.map(order => (
              <div key={order.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50">
                <div className="w-full md:w-auto">
                  <span className="text-lg font-black mr-3">#{order.id}</span>
                  <span className="font-bold mr-3">{order.customer_name}</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded uppercase">{order.status}</span>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                  <span className="font-black text-xl">{order.total_amount.toLocaleString('fr-FR')} Ar</span>
                  
                  <button onClick={() => printTicket(order)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 p-2 rounded-lg font-bold">
                    Imprimer
                  </button>
                  
                  {order.status === 'en_attente' && <button onClick={() => updateOrderStatus(order.id, 'pret')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Prêt</button>}
                  {(order.status === 'en_attente' || order.status === 'pret') && <button onClick={() => updateOrderStatus(order.id, 'paye')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Encaisser</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ZONE D'IMPRESSION DU TICKET (Masquée à l'écran, visible uniquement sur papier) --- */}
      <div className="hidden print:block p-8 bg-white text-black font-mono text-center w-full max-w-sm mx-auto">
        <h1 className="text-2xl font-black mb-1">MADA POS</h1>
        <p className="text-sm mb-6 border-b border-black pb-4">Ticket de caisse</p>
        
        <div className="text-left mb-6 space-y-2">
          <p><strong>Date :</strong> <span id="print-date"></span></p>
          <p><strong>Commande :</strong> #<span id="print-order-id"></span></p>
          <p><strong>Client :</strong> <span id="print-customer"></span></p>
        </div>
        
        <div className="border-t border-black pt-4 mt-6">
          <p className="text-xl font-black">TOTAL : <span id="print-total"></span></p>
        </div>
        
        <p className="mt-8 text-xs italic">Merci de votre visite !</p>
      </div>
    </>
  );
}

export default AdminDashboard;
