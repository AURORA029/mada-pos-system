import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// ARCHITECTURE RÉSEAU HYBRIDE V3 (Fix Electron Protocol)
const getBaseUrl = () => {
  // 1. Détection Electron (PC Windows)
  // Si le fichier est lu depuis le disque dur, le backend est forcément sur la machine locale.
  if (window.location.protocol === 'file:' || window.location.protocol === 'app:') {
    return 'http://localhost:5000';
  }
  
  // 2. Production Web (iPads connectés au PC en Wi-Fi)
  if (import.meta.env.PROD) {
    return window.location.origin; 
  }
  
  // 3. Développement (Codespaces / Vite)
  return '/';
};

// Création d'une instance Axios dédiée
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de Requête : Injection automatique du token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de Réponse : Gestion centralisée des erreurs et DRM
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    
    // DETECTION ZERO TRUST DU VERROUILLAGE DRM
    if (error.response && error.response.status === 403) {
      const errorData = error.response.data;
      if (errorData && errorData.error && errorData.error.startsWith('LICENSE_')) {
        const event = new CustomEvent('drm-lock', { 
          detail: { message: errorData.message, code: errorData.error } 
        });
        window.dispatchEvent(event);
      }
    }

    return Promise.reject(error);
  }
);

export default api;