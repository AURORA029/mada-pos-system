// ==========================================
// MADA POS SYSTEM - Interface Client / Menu (V3 avec Checkout)
// Fichier : frontend/src/pages/ClientMenu.jsx
// ==========================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // AJOUT : Pour la navigation secrète
import axios from 'axios';

function ClientMenu() {
  const navigate = useNavigate(); // AJOUT : Initialisation du navigateur
  
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [cart, setCart] = useState({});
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mvola');
  const [customerName, setCustomerName] = useState('Table 1');

  // --- LOGIQUE DE LA PORTE DÉROBÉE (BACKDOOR ADMIN) ---
  const [secretClickCount, setSecretClickCount] = useState(0);
  const clickTimeout = useRef(null);

  const handleSecretAccess = () => {
    setSecretClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) { // À 5 clics, on ouvre la porte
        navigate('/login');
        return 0;
      }
      return newCount;
    });

    // Si on arrête de cliquer, le compteur retombe à zéro après 1 seconde
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      setSecretClickCount(0);
    }, 1000);
  };
  // ---------------------------------------------------

  useEffect(() => {
    axios.get('/api/menu/items')
      .then(response => {
        setMenuItems(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur API:", err);
        setError("Impossible de charger le menu. Vérifiez la connexion au serveur.");
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const cats = menuItems.map(item => item.category_name);
    return ['Tous', ...new Set(cats)];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'Tous') return menuItems;
    return menuItems.filter(item => item.category_name === activeCategory);
  }, [menuItems, activeCategory]);

  const addToCart = (id) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) {
        newCart[id] -= 1;
      } else {
        delete newCart[id];
      }
      return newCart;
    });
  };

  const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const item = menuItems.find(i => i.id === parseInt(id));
    return total + (item ? item.price * qty : 0);
  }, 0);

  const confirmOrder = () => {
    const cartItemsArray = Object.entries(cart).map(([id, qty]) => {
      const item = menuItems.find(i => i.id === parseInt(id));
      return {
        item_id: item.id,
        name: item.name,
        quantity: qty,
        price: item.price
      };
    });

    axios.post('/api/orders', {
      customer_name: customerName,
      total_amount: cartTotal,
      payment_method: paymentMethod,
      cart_items: cartItemsArray 
    })
    .then(response => {
      alert("Succès : Votre commande a bien été enregistrée. (N° " + response.data.order_id + ")");
      setCart({});
      setIsCheckoutOpen(false);
    })
    .catch(err => {
      console.error("Erreur lors de la commande :", err);
      alert("Une erreur est survenue lors de l'envoi de la commande.");
    });
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-800 font-medium">Chargement du menu...</div>;
  if (error) return <div className="flex h-screen items-center justify-center bg-gray-50 text-red-600 font-bold px-6 text-center">{error}</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      
      <header className="bg-white px-6 py-5 sticky top-0 z-10 shadow-sm border-b border-slate-100 flex justify-between items-center">
        <div>
          {/* MODIFICATION ICI : Ajout de onClick et select-none */}
          <h1 
            onClick={handleSecretAccess}
            className="text-2xl font-black tracking-tight text-slate-900 cursor-pointer select-none"
            title="Appuyez 5 fois pour l'administration"
          >
            Mada POS
          </h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Menu Digital</p>
        </div>
        <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center relative">
          <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63-.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartItemCount}
            </span>
          )}
        </div>
      </header>

      {/* Reste du code inchangé (Catégories, Grille des plats, Barre de validation et Modale) */}
      <div className="px-4 py-6 overflow-x-auto whitespace-nowrap hide-scrollbar flex gap-3">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeCategory === category ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <main className="px-4 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <article key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 transition-transform hover:-translate-y-1">
            {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-24 h-24 rounded-xl object-cover flex-shrink-0 shadow-sm border border-slate-100" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0 flex items-center justify-center border border-slate-50">
                <span className="text-slate-400 text-xs font-medium">Image</span>
              </div>
            )}
            <div className="flex flex-col justify-between flex-grow">
              <div>
                <h2 className="text-lg font-bold leading-tight text-slate-800">{item.name}</h2>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>
              <div className="flex justify-between items-end mt-3">
                <span className="font-black text-lg text-slate-900">{item.price.toLocaleString('fr-FR')} <span className="text-sm text-slate-500 font-semibold">Ar</span></span>
                {cart[item.id] ? (
                  <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm font-bold text-slate-700 hover:bg-slate-50">-</button>
                    <span className="font-bold text-sm min-w-[1rem] text-center">{cart[item.id]}</span>
                    <button onClick={() => addToCart(item.id)} className="w-8 h-8 flex items-center justify-center bg-slate-900 rounded-md shadow-sm font-bold text-white hover:bg-slate-800">+</button>
                  </div>
                ) : (
                  <button onClick={() => addToCart(item.id)} className="bg-slate-900 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-slate-800 transition-colors">
                    Ajouter
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </main>

      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500 font-semibold">Total ({cartItemCount} articles)</p>
              <p className="text-2xl font-black text-slate-900">{cartTotal.toLocaleString('fr-FR')} Ar</p>
            </div>
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              Voir le panier
            </button>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-lg rounded-t-3xl md:rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Votre Commande</h2>
              <button onClick={() => setIsCheckoutOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="border-b border-slate-100 pb-4 mb-4 space-y-3">
              {Object.entries(cart).map(([id, qty]) => {
                const item = menuItems.find(i => i.id === parseInt(id));
                if (!item) return null;
                return (
                  <div key={id} className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">{qty}x {item.name}</span>
                    <span className="text-slate-900 font-bold">{(item.price * qty).toLocaleString('fr-FR')} Ar</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mb-6 text-lg">
              <span className="font-bold text-slate-600">Total à payer</span>
              <span className="font-black text-2xl text-emerald-600">{cartTotal.toLocaleString('fr-FR')} Ar</span>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Mode de paiement</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPaymentMethod('mvola')}
                  className={`border-2 py-3 rounded-xl font-bold transition-all ${paymentMethod === 'mvola' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  MVola
                </button>
                <button 
                  onClick={() => setPaymentMethod('especes')}
                  className={`border-2 py-3 rounded-xl font-bold transition-all ${paymentMethod === 'especes' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  Espèces
                </button>
              </div>

              {paymentMethod === 'mvola' && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-sm">
                  <p className="font-bold text-yellow-800 mb-1">Paiement par MVola</p>
                  <p className="text-yellow-700">Veuillez envoyer le montant au <strong>034 00 000 00</strong>. Présentez le SMS de confirmation au serveur.</p>
                </div>
              )}
              {paymentMethod === 'especes' && (
                <div className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm">
                  <p className="font-bold text-slate-800 mb-1">Paiement en espèces</p>
                  <p className="text-slate-600">Veuillez préparer la somme de <strong>{cartTotal.toLocaleString('fr-FR')} Ar</strong> à remettre au serveur.</p>
                </div>
              )}
            </div>

            <button 
              onClick={confirmOrder}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-colors text-lg"
            >
              Confirmer la commande
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientMenu;
