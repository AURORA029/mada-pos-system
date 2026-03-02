import { useState } from 'react';
import { authService } from '../services/authService';
import { paymentService } from '../services/paymentService';

const SetupWizard = ({ localIp, onComplete }) => {
  // Section 1 : Securite & Identite
  const [restaurantName, setRestaurantName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Section 2 : Paiement
  const [providerName, setProviderName] = useState('MVola');
  const [accountNumber, setAccountNumber] = useState('');
  const [motifPrefix, setMotifPrefix] = useState('PAY');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    if (!accountNumber.trim()) {
      setError("Veuillez saisir un numero de compte Mobile Money valide.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Initialisation de la securite et du restaurant
      await authService.setup(restaurantName, password);
      
      // 2. Connexion automatique pour obtenir le token JWT
      await authService.login(password);
      
      // 3. Creation du premier moyen de paiement mobile
      try {
        await paymentService.create({
          provider_name: providerName,
          account_number: accountNumber,
          motif_prefix: motifPrefix,
          is_mobile: true
        });
      } catch (paymentErr) {
        console.warn("[WIZARD] Erreur non-bloquante lors de la creation du paiement:", paymentErr);
      }

      // 4. Deverrouillage de l'application
      onComplete(); 
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue lors de la configuration.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h2 className="text-center text-3xl font-black text-gray-900">
          Initialisation MADA POS
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-gray-600 uppercase tracking-widest">
          Configuration du serveur local
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            
            {/* --- BLOC 1 : IDENTITE --- */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">1. Identite & Securite</h3>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Nom du Point de Vente</label>
                <input
                  type="text"
                  required
                  className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Ex: Mada Burger"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">Mot de passe Admin</label>
                  <input
                    type="password"
                    required
                    className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">Confirmer mot de passe</label>
                  <input
                    type="password"
                    required
                    className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* --- BLOC 2 : PAIEMENT MOBILE --- */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">2. Paiement Mobile Principal</h3>
              <p className="text-xs text-gray-500 font-medium mb-4">L'argent liquide (Especes) est configure par defaut. Ajoutez ici votre premier compte Mobile Money.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">Operateur</label>
                  <input
                    type="text"
                    required
                    className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    placeholder="Ex: MVola"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">Motif (Prefixe)</label>
                  <input
                    type="text"
                    required
                    className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-gray-900"
                    value={motifPrefix}
                    onChange={(e) => setMotifPrefix(e.target.value)}
                    placeholder="Ex: PAY"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase">Numero de Reception</label>
                <input
                  type="text"
                  required
                  className="mt-1 appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-lg tracking-wider text-gray-900"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Ex: 034 00 000 00"
                />
              </div>
            </div>

            {/* --- BLOC 3 : RESEAU --- */}
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
              <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-widest">Reseau Local (Auto-decouverte)</h3>
              <p className="mt-2 text-sm font-medium text-indigo-900">
                Vos appareils clients (tablettes/smartphones) devront se connecter a cette adresse IP via le Wi-Fi du restaurant :
              </p>
              <div className="mt-3 bg-white border border-indigo-200 py-3 px-4 rounded-lg text-center shadow-inner">
                <strong className="text-indigo-600 text-2xl font-black font-mono tracking-widest">{localIp || "Recherche..."}</strong>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !localIp}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-black text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 transition-all active:scale-95"
              >
                {isLoading ? "Configuration en cours..." : "Initialiser le Systeme"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;