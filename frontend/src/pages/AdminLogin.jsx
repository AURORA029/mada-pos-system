import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Le Zero Trust opère ici : c'est le backend qui valide
      await authService.login(password);
      navigate('/admin');
    } catch (err) {
      // Capture propre du message d'erreur du backend
      setError(err.response?.data?.error || "Erreur de connexion au serveur.");
      setPassword('');
    } finally {
      setIsLoading(false);
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
            <label className="block text-sm font-bold text-slate-700 mb-2 text-center">Mot de passe Administrateur</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-xl p-4 text-center text-2xl font-black tracking-widest focus:border-slate-900 focus:outline-none transition-colors disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500 text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-95"
          >
            {isLoading ? 'Vérification...' : 'Déverrouiller'}
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