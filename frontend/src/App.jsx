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
  
  // STATE CRITIQUE : Vient bloquer toute l'application si la licence est invalide
  const [drmError, setDrmError] = useState(null);

  useEffect(() => {
    // 1. Écouteur global pour l'alerte DRM déclenchée par api.js
    const handleDrmLock = (event) => {
      console.warn("🔒 VERROUILLAGE DRM ACTIVÉ :", event.detail);
      setDrmError(event.detail);
    };

    window.addEventListener('drm-lock', handleDrmLock);

    // 2. Initialisation normale du système
    const initSystem = async () => {
      try {
        const data = await authService.checkSetupStatus();
        setIsConfigured(data.isConfigured);
        setLocalIp(data.localIp);
      } catch (error) {
        console.error("Erreur critique d'initialisation système :", error);
        // Si l'erreur est un DRM, l'eventListener l'a déjà interceptée. 
        // Sinon, on part du principe que la base est vierge/inaccessible.
        setIsConfigured(false);
      }
    };
    
    initSystem();

    return () => {
      window.removeEventListener('drm-lock', handleDrmLock);
    };
  }, []);

  // PRIORITÉ 1 : VERROUILLAGE DE SÉCURITÉ (Bloque absolument tout)
  if (drmError) {
    return <LicenseLockScreen errorMessage={drmError.message} errorCode={drmError.code} />;
  }

  // PRIORITÉ 2 : Écran de chargement sécurisé
  if (isConfigured === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-bold text-lg animate-pulse">Initialisation sécurisée du système...</p>
      </div>
    );
  }

  // PRIORITÉ 3 : Verrouillage et redirection vers l'assistant d'installation (Si DB vierge)
  if (isConfigured === false) {
    return <SetupWizard localIp={localIp} onComplete={() => setIsConfigured(true)} />;
  }

  // PRIORITÉ 4 : Application normale (Si DB configurée et Licence OK)
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

export default App;