import { useState } from 'react';
import axios from 'axios';
import { Lock, Upload, AlertTriangle, CheckCircle } from 'lucide-react';

function LicenseLockScreen({ errorMessage, errorCode }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validation Front-End immédiate
      if (!selectedFile.name.endsWith('.lic')) {
        setStatusMsg({ type: 'error', text: 'Veuillez sélectionner un fichier valide (.lic).' });
        setFile(null);
        e.target.value = null; // Reset input
        return;
      }
      setFile(selectedFile);
      setStatusMsg({ type: '', text: '' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setStatusMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('licenseFile', file);

    // ARCHITECTURE RESEAU HYBRIDE (Idem que api.js)
    const getBaseUrl = () => {
      // En PROD (Windows/iPad) : On utilise l'IP dynamique absolue
      if (import.meta.env.PROD) return window.location.origin;
      // En DEV (Codespaces) : On retourne une chaîne vide. 
      // L'appel deviendra "/api/system/license" et passera par le proxy Vite sans bloquer le CORS.
      return '';
    };

    try {
      // On utilise axios natif avec notre URL hybride
      await axios.post(`${getBaseUrl()}/api/system/license`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setStatusMsg({ type: 'success', text: 'Licence validée. Redémarrage du système...' });
      
      // Reboot brutal de l'application React pour recharger les états et purger la RAM
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      setUploading(false);
      const serverMsg = error.response?.data?.message || "Erreur lors de l'upload de la licence.";
      setStatusMsg({ type: 'error', text: serverMsg });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 text-center animate-fade-in-up">
        
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={40} />
        </div>
        
        <h1 className="text-3xl font-black mb-2 text-white">Système Verrouillé</h1>
        
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
          <div className="flex items-center justify-center gap-2 text-red-400 font-bold mb-1">
            <AlertTriangle size={18} />
            <span>Erreur {errorCode || 'DRM'}</span>
          </div>
          <p className="text-slate-300 text-sm">
            {errorMessage || "Le fichier de licence est invalide, manquant ou a expiré."}
          </p>
        </div>

        <div className="space-y-6">
          <p className="text-slate-400 text-sm font-medium">
            Veuillez uploader votre nouveau fichier de licence (.lic) pour réactiver la caisse.
          </p>

          <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 bg-slate-900/50 hover:bg-slate-900 transition-colors relative">
            <input 
              type="file" 
              accept=".lic"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 pointer-events-none">
              <Upload size={24} className={file ? 'text-emerald-400' : 'text-slate-400'} />
              <span className={`font-bold text-sm ${file ? 'text-emerald-400' : 'text-slate-300'}`}>
                {file ? file.name : "Appuyez pour sélectionner mada_pos.lic"}
              </span>
            </div>
          </div>

          {statusMsg.text && (
            <div className={`p-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${statusMsg.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {statusMsg.type === 'success' && <CheckCircle size={16} />}
              {statusMsg.text}
            </div>
          )}

          <button 
            onClick={handleUpload}
            disabled={!file || uploading}
            className={`w-full font-black py-4 rounded-xl shadow-lg transition-all text-lg flex items-center justify-center gap-2 ${!file || uploading ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'}`}
          >
            {uploading ? 'Validation en cours...' : 'Déverrouiller le système'}
          </button>
        </div>
      </div>
      
      <p className="mt-8 text-slate-500 text-xs uppercase tracking-widest font-bold">
        Mada POS System - Security Protocol
      </p>
    </div>
  );
}

export default LicenseLockScreen;