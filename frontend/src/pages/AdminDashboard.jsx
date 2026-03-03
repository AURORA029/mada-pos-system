import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  ShoppingBag, Utensils, Settings, X, Banknote, Smartphone, 
  Plus, Trash2, ChefHat, BarChart3, LogOut, Lock, Database, CheckCircle, AlertTriangle
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { settingsService } from '../services/settingsService';
import { paymentService } from '../services/paymentService';
import { closingService } from '../services/closingService';
import { backupService } from '../services/backupService';
import { STORAGE_KEYS } from '../utils/constants'; 

// MASTER DEV FIX : Style d'impression natif optimisé pour iOS
const PRINT_STYLES = `
  @media print {
    @page { margin: 0; size: auto; }
    body { background: white; margin: 0; padding: 0; }
  }
`;

function AdminDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverIP, setServerIP] = useState(localStorage.getItem(STORAGE_KEYS.SERVER_IP) || '192.168.1.132');
  const [printConfig, setPrintConfig] = useState({ type: null, data: null });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [storeSettings, setStoreSettings] = useState({ restaurant_name: '' });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPayment, setNewPayment] = useState({ provider_name: '', account_number: '', motif_prefix: '', is_mobile: true });
  const [declaredCash, setDeclaredCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closingResult, setClosingResult] = useState(null);
  const [isProcessingClosing, setIsProcessingClosing] = useState(false);

  const fetchData = async () => {
    try {
      // 1. AUTO-DÉTECTION DE L'IP : On interroge le backend silencieusement
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const statusRes = await fetch('/api/auth/setup-status', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          // Si le backend trouve une IP valide, on écrase l'ancienne
          if (statusData.localIp && statusData.localIp !== 'Non disponible') {
            setServerIP(statusData.localIp);
            localStorage.setItem(STORAGE_KEYS.SERVER_IP, statusData.localIp);
          }
        }
      } catch (ipError) {
        console.warn("[SYS_WARN] Impossible de rafraîchir l'IP auto :", ipError);
      }

      // 2. CHARGEMENT DES DONNÉES MÉTIER (Le code d'origine)
      const [ordersData, settingsData, paymentsData] = await Promise.all([
        orderService.getAllOrders(),
        settingsService.getSettings(),
        paymentService.getAll()
      ]);
      
      setOrders(ordersData);
      setStoreSettings({ restaurant_name: settingsData.restaurant_name || '' });
      setPaymentMethods(paymentsData);
      setLoading(false);
    } catch (err) { 
      console.error("[SYS_ERROR] Échec du chargement :", err); 
    }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
        orderService.getAllOrders().then(setOrders).catch(err => console.error(err));
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (printConfig.type !== null) {
      const paintDelay = setTimeout(() => {
        window.print();
        setTimeout(() => setPrintConfig({ type: null, data: null }), 1000);
      }, 700);
      return () => clearTimeout(paintDelay);
    }
  }, [printConfig]);

  const saveIP = (ip) => { setServerIP(ip); localStorage.setItem(STORAGE_KEYS.SERVER_IP, ip); };
  const updateOrderStatus = (id, newStatus) => {
    orderService.updateStatus(id, newStatus).then(fetchData).catch(() => alert("Erreur status"));
  };
  const handleLogout = () => { localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN); navigate('/login'); };
  
  const saveSettings = async (e) => {
    e.preventDefault();
    try { await settingsService.updateSettings(storeSettings); alert("Enregistré avec succès."); } catch { alert("Erreur sauvegarde."); }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!newPayment.provider_name) return;
    try {
      await paymentService.create(newPayment);
      setNewPayment({ provider_name: '', account_number: '', motif_prefix: '', is_mobile: true });
      fetchData();
    } catch { alert("Erreur lors de l'ajout."); }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Supprimer ce moyen de paiement ?")) return;
    try { await paymentService.delete(id); fetchData(); } catch { alert("Erreur suppression."); }
  };

  const handleToggleActive = async (payment) => {
    try {
      await paymentService.update(payment.id, { ...payment, is_active: !payment.is_active });
      fetchData();
    } catch { alert("Erreur statut."); }
  };

  const handlePerformClosing = async (e) => {
    e.preventDefault();
    setIsProcessingClosing(true);
    try {
      const result = await closingService.performClosing({ 
        declared_cash: parseFloat(declaredCash) || 0, 
        notes: closingNotes 
      });
      // MASTER DEV FIX : Le backend encapsule les totaux dans result.data
      setClosingResult(result.data);
    } catch (err) { 
      alert("Erreur lors de la clôture : " + (err.response?.data?.error || "Serveur indisponible")); 
    } finally {
      setIsProcessingClosing(false);
    }
  };

  const handleBackup = async () => {
    try {
      const blob = await backupService.downloadDatabase();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mada_pos_backup_${new Date().toISOString().split('T')[0]}.sqlite`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert("Erreur lors du backup."); }
  };

  const activeOrders = orders.filter(o => o.status !== 'paye');
  if (loading) return <div className="p-8 text-center font-black text-slate-400 uppercase tracking-widest">Initialisation...</div>;

  return (
    <>
      {/* ==========================================
          INTERFACE UTILISATEUR (CACHÉE À L'IMPRESSION)
          ========================================== */}
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:hidden font-sans">
        <header className="mb-8 flex justify-between items-start md:items-end flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Caisse / Dashboard</h1>
            <p className="text-slate-500 font-medium mt-1 text-xs uppercase tracking-widest">Système Connecté</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setIsClosingModalOpen(true)} className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg active:scale-95 transition-all"><Lock size={18} /> Fermer Caisse</button>
            <button onClick={() => navigate('/kitchen')} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg active:scale-95 transition-all"><ChefHat size={18} /> Cuisine</button>
            <button onClick={() => navigate('/admin/menu')} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"><Utensils size={18} /> Menu</button>
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"><Settings size={18} /> Paramètres</button>
            <button onClick={() => navigate('/admin/stats')} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2.5 rounded-xl font-bold hover:bg-blue-200"><BarChart3 size={18} /> Stats</button>
            <button onClick={handleLogout} className="flex items-center gap-2 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl font-bold hover:bg-red-50"><LogOut size={18} /> Quitter</button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Commandes en attente ({activeOrders.length})</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {activeOrders.length === 0 ? (
                  <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest text-sm">Aucune commande en cours</div>
              ) : activeOrders.map(order => (
                <div key={order.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="w-full md:w-auto flex flex-wrap items-center gap-3">
                    <span className="text-lg font-black text-slate-900">#{order.id}</span>
                    <span className="font-bold text-slate-700">{order.customer_name}</span>
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase border bg-teal-50 text-teal-700 border-teal-200">{order.order_type?.replace('_', ' ')}</span>
                    <span className="px-2.5 py-1 text-[10px] font-black rounded-lg uppercase border bg-green-50 text-green-700 border-green-200">{order.payment_method}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-xl text-slate-900">{Number(order.total_amount).toLocaleString('fr-FR')} Ar</span>
                    <button onClick={() => setPrintConfig({ type: 'ticket', data: order })} className="bg-slate-100 p-2.5 rounded-xl font-bold text-slate-600 active:scale-95">Ticket</button>
                    {order.status === 'en_attente' && <button onClick={() => updateOrderStatus(order.id, 'pret')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold active:scale-95 transition-all">Prêt</button>}
                    <button onClick={() => updateOrderStatus(order.id, 'paye')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold active:scale-95 transition-all">Encaisser</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col items-center">
            <h2 className="text-lg font-bold mb-4 self-start text-slate-800 uppercase tracking-tight">Accès Menu Client</h2>
            <div className="mb-4 w-full text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresse IP du Serveur</label>
              <input type="text" value={serverIP} onChange={(e) => saveIP(e.target.value)} className="w-full border-2 border-slate-100 p-3 rounded-xl mt-1 font-mono text-sm focus:border-indigo-500 outline-none transition-all" />
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200 mb-6">
              <QRCodeCanvas value={`http://${serverIP}:5000`} size={160} level={"H"} includeMargin={true} />
            </div>
            <button onClick={() => setPrintConfig({ type: 'qr', data: null })} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black shadow-lg shadow-slate-900/20 active:scale-95 transition-all uppercase text-sm tracking-wider">Imprimer QR de Table</button>
          </div>
        </div>

        {/* MODALE PARAMÈTRES */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 uppercase"><Settings size={20}/> Configurations</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-slate-50 rounded-full"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-10">
                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Sécurité & Sauvegarde</h3>
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 flex items-center justify-between">
                    <div><h4 className="font-bold">Base de données</h4><p className="text-xs text-slate-500 mt-1 uppercase">Télécharger mada_pos.sqlite</p></div>
                    <button onClick={handleBackup} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold active:scale-95"><Database size={18} /> Exporter</button>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Établissement</h3>
                  <form onSubmit={saveSettings} className="flex gap-4">
                    <input type="text" value={storeSettings.restaurant_name} onChange={(e) => setStoreSettings({ restaurant_name: e.target.value })} className="flex-grow border-2 border-slate-100 px-4 py-3 rounded-2xl font-bold outline-none focus:border-indigo-500" required />
                    <button type="submit" className="bg-slate-900 text-white font-bold px-6 py-3 rounded-2xl active:scale-95">Sauver</button>
                  </form>
                </section>

                <section>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Paiements</h3>
                  <div className="space-y-3 mb-6">
                    {paymentMethods.map(payment => (
                      <div key={payment.id} className={`flex items-center justify-between p-4 border-2 rounded-2xl ${!!payment.is_active ? 'border-slate-100 bg-white' : 'border-slate-50 opacity-60'}`}>
                        <div>
                          <p className="font-black text-sm uppercase">{payment.provider_name}</p>
                          {!!payment.is_mobile && <p className="text-[10px] text-slate-500 font-mono font-bold mt-1">{payment.account_number} | {payment.motif_prefix}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleToggleActive(payment)} className={`text-[10px] font-black px-3 py-1.5 rounded-lg border uppercase ${!!payment.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-200'}`}>
                            {!!payment.is_active ? 'Actif' : 'Off'}
                          </button>
                          {!!payment.is_mobile && <button onClick={() => handleDeletePayment(payment.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18} /></button>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleAddPayment} className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nouveau Mobile Money</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <input type="text" placeholder="Opérateur" required value={newPayment.provider_name} onChange={e => setNewPayment({...newPayment, provider_name: e.target.value})} className="border-2 border-slate-100 px-4 py-3 rounded-xl text-sm font-bold" />
                      <input type="text" placeholder="Numéro" required value={newPayment.account_number} onChange={e => setNewPayment({...newPayment, account_number: e.target.value})} className="border-2 border-slate-100 px-4 py-3 rounded-xl text-sm font-mono" />
                      <input type="text" placeholder="Motif" required value={newPayment.motif_prefix} onChange={e => setNewPayment({...newPayment, motif_prefix: e.target.value})} className="border-2 border-slate-100 px-4 py-3 rounded-xl text-sm font-mono" />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl active:scale-95 uppercase text-xs tracking-widest">Enregistrer</button>
                  </form>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* MODALE CLÔTURE DE CAISSE */}
        {isClosingModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
              {!closingResult ? (
                <form onSubmit={handlePerformClosing}>
                  <div className="p-8 border-b bg-amber-50 flex justify-between items-center">
                    <h2 className="text-xl font-black text-amber-900 uppercase flex items-center gap-3"><Lock size={24}/> Clôture de Caisse</h2>
                    <button type="button" onClick={() => setIsClosingModalOpen(false)}><X size={24}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Espèces en Caisse (Ar)</label>
                      <input type="number" value={declaredCash} onChange={e => setDeclaredCash(e.target.value)} className="w-full border-2 border-slate-100 p-5 rounded-2xl font-black text-2xl outline-none focus:border-amber-500" placeholder="0" required />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Notes d'audit</label>
                      <textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)} className="w-full border-2 border-slate-100 p-4 rounded-2xl font-bold text-sm outline-none focus:border-amber-500" rows="3" placeholder="RAS..."></textarea>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed italic">Note : Cette action archivera les ventes actuelles et remettra le compteur journalier à zéro.</p>
                    </div>
                  </div>
                  <div className="p-8 pt-0">
                    <button type="submit" disabled={isProcessingClosing} className="w-full bg-slate-900 text-white font-black py-6 rounded-2xl uppercase text-sm tracking-widest shadow-xl active:scale-95 disabled:bg-slate-400">
                      {isProcessingClosing ? 'Calcul en cours...' : 'Confirmer la Fermeture'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} />
                  </div>
                  <h2 className="text-2xl font-black uppercase text-slate-900">Caisse Clôturée</h2>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Attendu</p>
                      <p className="font-black text-lg">{Number(closingResult?.system_expected || 0).toLocaleString()} Ar</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Déclaré</p>
                      <p className="font-black text-lg">{Number(closingResult?.declared_cash || 0).toLocaleString()} Ar</p>
                    </div>
                </div>
                
                {Number(closingResult?.gap || 0) !== 0 && (
                  <div className={`p-4 rounded-2xl flex items-center gap-3 border-2 ${Number(closingResult?.gap || 0) < 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                    <AlertTriangle size={20} />
                    <p className="font-black uppercase text-xs">Écart : {Number(closingResult?.gap || 0).toLocaleString()} Ar</p>
                  </div>
                )}
                
                <button onClick={() => { setIsClosingModalOpen(false); setClosingResult(null); setDeclaredCash(''); fetchData(); }} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl uppercase text-xs tracking-[0.2em]">Retour au Dashboard</button>
                  </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          ZONE D'IMPRESSION (VISIBLE UNIQUEMENT SUR PAPIER)
          ========================================== */}
      <style>{PRINT_STYLES}</style>
      {printConfig.type && (
        <div className="hidden print:block absolute top-0 left-0 w-full bg-white z-[100] text-black font-mono p-4">
          {printConfig.type === 'ticket' && printConfig.data ? (
            <div className="w-full max-w-[80mm] mx-auto text-left">
              <h2 className="text-xl font-bold uppercase text-center">{storeSettings.restaurant_name}</h2>
              <p className="border-b border-dashed my-2 border-black">-------------------------</p>
              <p className="font-bold">CMD: #{printConfig.data.id}</p>
              <p className="font-bold uppercase">Client: {printConfig.data.customer_name}</p>
              <p className="border-b border-dashed my-2 border-black">-------------------------</p>
              {printConfig.data.items?.map(item => (
                <div key={item.id} className="flex justify-between text-xs font-bold mb-1">
                  <span className="truncate pr-2">{item.quantity}x {item.name || item.item_name}</span>
                  <span>{(Number(item.price) * Number(item.quantity)).toLocaleString()}</span>
                </div>
              ))}
              <p className="border-t border-dashed mt-2 pt-2 font-black flex justify-between text-sm">
                <span>TOTAL:</span>
                <span>{Number(printConfig.data.total_amount).toLocaleString()} Ar</span>
              </p>
              <p className="mt-6 text-center text-[10px] font-bold">Merci de votre visite !</p>
            </div>
          ) : printConfig.type === 'qr' ? (
            <div className="w-full max-w-[80mm] mx-auto text-center py-10">
               <h2 className="text-2xl font-black uppercase mb-6">{storeSettings.restaurant_name}</h2>
               <div className="flex justify-center mb-6">
                 <QRCodeCanvas value={`http://${serverIP}:5000`} size={200} level={"H"} />
               </div>
               <p className="text-lg font-black uppercase border-t-2 border-dashed border-black pt-4">Scanner pour le Menu</p>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

export default AdminDashboard;