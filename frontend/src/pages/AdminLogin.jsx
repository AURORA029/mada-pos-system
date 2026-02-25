import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin() {
  const [pinCode, setPinCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Code PIN codé en dur pour le MVP (à déplacer côté serveur pour la V2)
    const SECRET_PIN = "1234";

    if (pinCode === SECRET_PIN) {
      // Stockage de l'autorisation dans le stockage local du navigateur
      localStorage.setItem('mada_pos_auth', 'true');
      navigate('/admin');
    } else {
      setError("Code PIN incorrect.");
      setPinCode('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900">Mada POS</h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Accès Caisse</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 font-bold p-3 rounded-lg mb-6 text-center text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 text-center">Entrez votre code PIN</label>
            <input 
              type="password" 
              value={pinCode} 
              onChange={(e) => setPinCode(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-xl p-4 text-center text-2xl font-black tracking-widest focus:border-slate-900 focus:outline-none transition-colors"
              placeholder="••••"
              maxLength="4"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            Déverrouiller
          </button>
        </form>
      </div>
      
      <button 
        onClick={() => navigate('/')}
        className="mt-8 text-slate-400 font-semibold hover:text-white transition-colors"
      >
        ← Retour au menu client
      </button>
    </div>
  );
}

export default AdminLogin;