import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Plus, Minus, Trash2, Utensils, ShoppingBag, 
  X, CheckCircle, ChefHat, ArrowRight, Store, Banknote, Smartphone
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { menuService } from '../services/menuService';
import api from '../services/api';

function ClientMenu() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [clickCount, setClickCount] = useState(0);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const cartItems = useCartStore((state) => state.items);
  const orderType = useCartStore((state) => state.orderType);
  const setOrderType = useCartStore((state) => state.setOrderType);
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice());
  const getTotalItems = useCartStore((state) => state.getTotalItems());

  // ARCHITECTURE RESEAU : S'adapte dynamiquement a l'IP (Localhost PC ou IP Wi-Fi iPad)
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${window.location.origin}${cleanPath}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, items, paymentsRes] = await Promise.all([
          menuService.getCategories(),
          menuService.getItems(),
          api.get('/api/payments').catch(() => ({ data: [] }))
        ]);
        setCategories(cats || []);
        setMenuItems((items || []).filter(i => !i.is_deleted));
        const activePayments = (paymentsRes.data || []).filter(p => !!p.is_active);
        setPaymentMethods(activePayments);
        if (activePayments.length > 0) setSelectedPayment(activePayments[0].provider_name);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleCheckout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Vérifications de sécurité
    if (cartItems.length === 0) {
      alert("Votre panier est vide.");
      return;
    }
    if (!customerName.trim()) {
      alert("Veuillez saisir un nom ou un numéro de table.");
      return;
    }
    
    const finalPayment = selectedPayment || (paymentMethods.length > 0 ? paymentMethods[0].provider_name : 'Especes');

    setIsSubmitting(true);
    
    const payload = {
      customer_name: customerName.trim(),
      order_type: orderType,
      total_amount: Number(getTotalPrice), 
      payment_method: finalPayment,
      cart_items: cartItems.map(i => ({
        item_id: i.id,
        name: i.name,
        quantity: Number(i.quantity),
        price: Number(i.price)
      }))
    };

    console.log("[DEBUG] Envoi payload vers Backend:", payload);

    try {
      const response = await api.post('/api/orders', payload);
      if (response.data) {
        setOrderSuccess(true);
        clearCart();
        setIsCartOpen(false);
      }
    } catch (err) { 
      console.error("[ERROR] Échec de la commande:", err.response?.data || err.message);
      alert("Erreur serveur : " + (err.response?.data?.error || "Le serveur ne répond pas.")); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const filteredItems = activeCategory === 'all' ? menuItems : menuItems.filter(i => String(i.category_id) === String(activeCategory));

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-slate-300">SYNCHRONISATION...</div>;

  if (orderSuccess) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
      <CheckCircle size={80} className="text-emerald-500 mb-6" />
      <h1 className="text-3xl font-black uppercase">Merci !</h1>
      <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-xs">Commande transmise en cuisine</p>
      <button onClick={() => { setOrderSuccess(null); setCustomerName(''); }} className="mt-12 bg-white text-slate-900 px-10 py-5 rounded-3xl font-black uppercase tracking-widest active:scale-95">Retour Menu</button>
    </div>
  );

  const selectedPaymentInfo = paymentMethods.find(p => p.provider_name === selectedPayment);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3" onClick={() => { setClickCount(c => { if(c+1 >= 5) navigate('/login'); return c+1; }); setTimeout(() => setClickCount(0), 2000); }}>
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20"><Store size={24}/></div>
          <h1 className="text-xl font-black tracking-tighter uppercase">Mada POS</h1>
        </div>
        <button onClick={() => setIsCartOpen(true)} className="relative bg-white border-2 border-slate-100 p-3 rounded-2xl shadow-sm">
          <ShoppingCart size={24} />
          {getTotalItems > 0 && <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-white">{getTotalItems}</span>}
        </button>
      </header>

      <div className="sticky top-[81px] z-20 bg-slate-50/90 py-4 px-4 overflow-x-auto border-b flex gap-3 no-scrollbar">
        <button onClick={() => setActiveCategory('all')} className={`whitespace-nowrap px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${activeCategory === 'all' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border text-slate-400'}`}>Tout</button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(String(cat.id))} className={`whitespace-nowrap px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${String(activeCategory) === String(cat.id) ? 'bg-slate-900 text-white shadow-xl' : 'bg-white border text-slate-400'}`}>{cat.name}</button>
        ))}
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => {
          const isAvail = !!(item.is_available === 1 || item.is_available === true || item.is_available === undefined);
          const inCart = cartItems.find(i => i.id === item.id);
          const img = getImageUrl(item.image_url);
          return (
            <div key={item.id} className={`bg-white rounded-[2.5rem] p-5 border border-slate-100 shadow-sm flex flex-col justify-between transition-all ${!isAvail ? 'opacity-40 grayscale' : 'hover:shadow-2xl'}`}>
              <div>
                {img && <div className="w-full h-48 mb-5 rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100"><img src={img} alt={item.name} className="w-full h-full object-cover" /></div>}
                <div className="flex justify-between items-start mb-2 px-1">
                  <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight leading-tight">{item.name}</h3>
                  <span className="font-black text-slate-900 text-sm whitespace-nowrap">{Number(item.price).toLocaleString('fr-FR')} Ar</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 px-1">{item.description}</p>
              </div>
              <div className="mt-6">
                {!isAvail ? <div className="text-center font-black py-4 uppercase text-[10px] tracking-widest text-slate-300 bg-slate-50 rounded-2xl border border-dashed border-slate-200">Épuisé</div> : inCart ? (
                  <div className="flex items-center justify-between bg-indigo-50 rounded-3xl p-1.5 border border-indigo-100">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 active:scale-90 transition-all"><Minus size={20}/></button>
                    <span className="font-black text-indigo-900 text-xl">{inCart.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-sm flex items-center justify-center active:scale-90 transition-all"><Plus size={20}/></button>
                  </div>
                ) : (
                  <button onClick={() => addItem(item)} className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg">Ajouter</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isCartOpen && getTotalItems > 0 && (
        <div className="fixed bottom-0 left-0 w-full p-4 z-40 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pt-10 md:hidden">
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-slate-900 text-white font-black py-6 px-8 rounded-[2.5rem] shadow-2xl flex justify-between items-center border-t border-slate-800">
            <div className="flex items-center gap-4">
               <div className="bg-indigo-600 w-10 h-10 rounded-2xl flex items-center justify-center text-sm">{getTotalItems}</div>
               <span className="uppercase text-[11px] font-black tracking-widest">Voir Panier</span>
            </div>
            <span className="text-xl font-black">{getTotalPrice.toLocaleString('fr-FR')} Ar</span>
          </button>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in-right">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3"><ShoppingCart size={24}/> Panier</h2>
              <button onClick={() => setIsCartOpen(false)} className="bg-white border border-slate-200 p-3 rounded-2xl"><X size={24}/></button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 space-y-8 no-scrollbar">
              <div className="flex bg-slate-100 p-1.5 rounded-3xl border border-slate-200">
                <button onClick={() => setOrderType('sur_place')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${orderType === 'sur_place' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}>Sur Place</button>
                <button onClick={() => setOrderType('a_emporter')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase transition-all ${orderType === 'a_emporter' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}>À Emporter</button>
              </div>

              <input value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full border-2 border-slate-100 p-5 rounded-3xl font-black focus:border-indigo-600 outline-none uppercase text-sm" placeholder="NOM OU TABLE" required />

              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between group bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100">
                    <div className="flex-1 pr-4"><p className="font-black text-slate-900 text-xs uppercase leading-tight">{item.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{(item.price * item.quantity).toLocaleString('fr-FR')} Ar</p></div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-white flex items-center justify-center text-slate-400 active:scale-90"><Minus size={14}/></button>
                        <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-white flex items-center justify-center text-slate-900 active:scale-90"><Plus size={14}/></button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-red-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-4 block ml-1 tracking-widest">Paiement</p>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map(pm => (
                    <button key={pm.id} onClick={() => setSelectedPayment(pm.provider_name)} className={`p-5 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${selectedPayment === pm.provider_name ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>
                      {!!pm.is_mobile ? <Smartphone size={24}/> : <Banknote size={24}/>}
                      <span className="text-[10px] uppercase font-black tracking-widest">{pm.provider_name}</span>
                    </button>
                  ))}
                </div>
                {selectedPaymentInfo && !!selectedPaymentInfo.is_mobile && (
                  <div className="mt-5 p-6 bg-indigo-600 text-white rounded-[2rem] text-[11px] font-bold uppercase leading-relaxed shadow-xl">
                    <p className="opacity-70">Transfert Mobile :</p><p className="text-sm font-black underline">{selectedPaymentInfo.account_number}</p>
                    <p className="opacity-70 mt-2">Motif :</p><p className="text-sm font-black">{selectedPaymentInfo.motif_prefix}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t bg-white sticky bottom-0 shadow-inner">
              <div className="flex justify-between items-end mb-6 px-1"><span className="font-black text-slate-400 uppercase text-[10px]">Total</span><span className="text-4xl font-black text-slate-900 tracking-tighter">{getTotalPrice.toLocaleString('fr-FR')} Ar</span></div>
              <button onClick={handleCheckout} disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 uppercase text-xs tracking-[0.3em] active:scale-95 disabled:bg-slate-200">
                {isSubmitting ? 'Transmission...' : <><ArrowRight size={20}/> Valider</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientMenu;