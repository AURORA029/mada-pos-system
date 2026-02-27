import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { orderService } from '../services/orderService';
import { STORAGE_KEYS } from '../utils/constants'; 
function AdminDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Remplacement de la chaîne en dur par la constante
  const [serverIP, setServerIP] = useState(localStorage.getItem(STORAGE_KEYS.SERVER_IP) || '192.168.1.132');
  const [printConfig, setPrintConfig] = useState({ type: null, data: null });

  // Appel via le Service (SRP respecté)
  const fetchOrders = () => {
    orderService.getAllOrders()
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => console.error("Erreur chargement:", err));
  };

  useEffect(() => {
    fetchOrders();
    const intervalId = setInterval(fetchOrders, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (printConfig.type !== null) {
      window.print();
      setTimeout(() => setPrintConfig({ type: null, data: null }), 1000); 
    }
  }, [printConfig]);

  const saveIP = (ip) => {
    setServerIP(ip);
    localStorage.setItem(STORAGE_KEYS.SERVER_IP, ip);
  };

  // Appel via le Service
  const updateOrderStatus = (id, newStatus) => {
    orderService.updateStatus(id, newStatus)
      .then(() => fetchOrders())
      .catch(err => alert("Erreur de mise à jour du statut."));
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    navigate('/login');
  };

  const activeOrders = orders.filter(order => order.status !== 'paye');

  const triggerPrintTicket = (order) => setPrintConfig({ type: 'ticket', data: order });
  const triggerPrintQR = () => setPrintConfig({ type: 'qr', data: null });

  if (loading) return <div className="p-8 text-center font-bold">Chargement...</div>;

  return (
    <>
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:hidden">
        <header className="mb-8 flex justify-between items-start md:items-end flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Caisse / Dashboard</h1>
            <p className="text-slate-500 font-medium mt-1 animate-pulse">Système en ligne</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => navigate('/admin/stats')} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold hover:bg-blue-200">Statistiques</button>
            <button onClick={() => navigate('/admin/menu')} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800">Menu</button>
            <button onClick={handleLogout} className="border border-red-200 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50">Déconnexion</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="text-xl font-bold">Commandes en cours ({activeOrders.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {activeOrders.map(order => (
                <div key={order.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50">
                  <div className="w-full md:w-auto">
                    <span className="text-lg font-black mr-3">#{order.id}</span>
                    <span className="font-bold mr-3">{order.customer_name}</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded uppercase">{order.status}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-xl">{order.total_amount.toLocaleString('fr-FR')} Ar</span>
                    <button onClick={() => triggerPrintTicket(order)} className="bg-slate-200 p-2 rounded-lg font-bold hover:bg-slate-300">Ticket</button>
                    {order.status === 'en_attente' && <button onClick={() => updateOrderStatus(order.id, 'pret')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Prêt</button>}
                    <button onClick={() => updateOrderStatus(order.id, 'paye')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Encaisser</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
            <h2 className="text-lg font-bold mb-4 self-start">Accès Client (QR Code)</h2>
            <div className="mb-4 w-full">
              <label className="text-xs font-bold text-slate-500 uppercase">IP du PC (Serveur)</label>
              <input 
                type="text" 
                value={serverIP} 
                onChange={(e) => saveIP(e.target.value)}
                className="w-full border p-2 rounded mt-1 font-mono text-sm"
                placeholder="Ex: 192.168.1.132"
              />
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200 mb-6">
              <QRCodeCanvas 
                value={`http://${serverIP}:5000`} 
                size={150} 
                level={"H"}
                includeMargin={true}
              />
            </div>

            <button 
              onClick={triggerPrintQR}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              Imprimer Support de Table
            </button>
            <p className="text-[10px] text-slate-400 mt-4 text-center">
              L'adresse actuelle est : <strong>http://{serverIP}:5000</strong>
            </p>
          </div>
        </div>
      </div>

      {printConfig.type === 'ticket' && printConfig.data && (
        <div className="hidden print:block p-8 bg-white text-black font-mono text-center w-[80mm] mx-auto">
          <h1 className="text-xl font-black mb-1">MADA POS</h1>
          <p className="text-[10px] mb-4 border-b border-black pb-2">Ticket de caisse</p>
          <div className="text-left text-[12px] space-y-1">
            <p>Date: <span>{new Date().toLocaleString('fr-FR')}</span></p>
            <p>Ticket: #<span>{printConfig.data.id}</span></p>
            <p>Client: <span>{printConfig.data.customer_name}</span></p>
          </div>
          <div className="border-t border-black pt-2 mt-4">
            <p className="text-lg font-black">TOTAL: <span>{printConfig.data.total_amount.toLocaleString('fr-FR')} Ar</span></p>
          </div>
        </div>
      )}

      {printConfig.type === 'qr' && (
        <div className="hidden print:flex flex-col items-center justify-center min-h-screen p-20 bg-white text-black border-[10px] border-slate-900 m-10 rounded-[50px]">
          <h1 className="text-6xl font-black mb-4">MADA POS</h1>
          <p className="text-2xl font-bold text-slate-600 mb-12 uppercase tracking-widest">Menu Digital</p>
          
          <div className="p-10 border-[5px] border-black rounded-[30px] mb-12 shadow-2xl">
            <QRCodeCanvas 
              value={`http://${serverIP}:5000`} 
              size={400} 
              level={"H"}
            />
          </div>
          
          <p className="text-4xl font-black text-center leading-tight">
            SCANNEZ ICI <br/> 
            <span className="text-2xl font-medium text-slate-500">Pour commander depuis votre table</span>
          </p>
          
          <div className="mt-20 pt-10 border-t border-slate-200 w-full text-center">
              <p className="text-xl font-bold text-slate-400">Réseau Wi-Fi du restaurant requis</p>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminDashboard;