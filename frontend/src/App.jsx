import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ClientMenu from './pages/ClientMenu';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenu from './pages/AdminMenu';
import AdminLogin from './pages/AdminLogin';
import AdminStats from './pages/AdminStats';
import SetupWizard from './pages/SetupWizard';
import LicenseLockScreen from './components/LicenseLockScreen';
import { authService } from './services/authService';
import { STORAGE_KEYS } from './utils/constants';
import KitchenDisplay from './pages/KitchenDisplay';

// Composant de protection des routes (Private Route - Standard V2)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  const isAuthenticated = !!token;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const [isConfigured, setIsConfigured] = useState(null);
  const [localIp, setLocalIp] = useState('');
  
  // STATES CRITIQUES
  const [drmError, setDrmError] = useState(null);
  const [systemError, setSystemError] = useState(null); // Gère les déconnexions Backend

  useEffect(() => {
    // 1. Écouteur global pour l'alerte DRM déclenchée par api.js
    const handleDrmLock = (event) => {
      console.error("[DRM_ERROR]: VERROUILLAGE ACTIVÉ :", event.detail);
      setDrmError(event.detail);
    };

    window.addEventListener('drm-lock', handleDrmLock);

    // 2. Initialisation stricte du système
    const initSystem = async () => {
      try {
        const data = await authService.checkSetupStatus();
        
        // ZERO TRUST : Validation stricte du type pour éviter la faille "undefined"
        if (data && typeof data.isConfigured === 'boolean') {
          setIsConfigured(data.isConfigured);
          setLocalIp(data.localIp || '');
        } else {
          throw new Error("Payload API invalide : isConfigured manquant.");
        }
      } catch (error) {
        console.error("[BOOT_ERROR]: Échec critique d'initialisation :", error);
        
        // FAIL-CLOSED : Si erreur réseau (backend Electron pas encore prêt), on bloque.
        // On ne présume JAMAIS que la base est vierge sur une erreur.
        if (error.message === 'Failed to fetch' || error.message.includes('Network Error')) {
          setSystemError("Connexion au serveur perdue. Attente du démarrage du backend...");
        } else {
          // Si ce n'est pas un DRM (déjà géré), on affiche une erreur générique
          setSystemError("Erreur d'initialisation système. Veuillez relancer l'application.");
        }
      }
    };
    
    initSystem();

    return () => {
      window.removeEventListener('drm-lock', handleDrmLock);
    };
  }, []);

  // --- ROUTAGE SÉCURISÉ STRICT (FAIL-CLOSED) ---

  // PRIORITÉ 1 : VERROUILLAGE DRM (Bloque absolument tout)
  if (drmError) {
    return <LicenseLockScreen errorMessage={drmError.message} errorCode={drmError.code} />;
  }

  // PRIORITÉ 2 : ERREUR SYSTÈME / BACKEND INACCESSIBLE
  if (systemError) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50">
        <div className="text-center p-8 bg-white rounded shadow-lg border-t-4 border-red-600">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur Système Critique</h1>
          <p className="text-gray-700">{systemError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // PRIORITÉ 3 : ÉCRAN DE CHARGEMENT SÉCURISÉ
  if (isConfigured === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-bold text-lg animate-pulse">Initialisation sécurisée du système...</p>
      </div>
    );
  }

  // PRIORITÉ 4 : ASSISTANT D'INSTALLATION (Strictement false)
  if (isConfigured === false) {
    return <SetupWizard localIp={localIp} onComplete={() => setIsConfigured(true)} />;
  }

  // PRIORITÉ 5 : APPLICATION NORMALE (Strictement true)
  if (isConfigured === true) {
    return (
      <Router>
        <Routes>
          {/* Routes Publiques */}
          <Route path="/" element={<ClientMenu />} />
          <Route path="/login" element={<AdminLogin />} />
          
          {/* Routes Protégées (Administration) */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/menu" element={<ProtectedRoute><AdminMenu /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute><AdminStats /></ProtectedRoute>} />
          <Route path="/kitchen" element={<ProtectedRoute><KitchenDisplay /></ProtectedRoute>} />
        </Routes>
      </Router>
    );
  }

  // PRIORITÉ 6 (ANTI-FAIL-OPEN) : Sécurité Ultime
  // Si le state est "undefined" ou altéré, on bloque tout avec un écran noir.
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <p className="text-red-500 font-bold text-xl">🛑 ERREUR FATALE : ÉTAT SÉCURITÉ INCONNU. SYSTÈME BLOQUÉ.</p>
    </div>
  );
}

export default App;