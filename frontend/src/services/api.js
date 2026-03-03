import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// ARCHITECTURE RÉSEAU HYBRIDE (Anti-Fragile)
const getBaseUrl = () => {
  // En PRODUCTION (PC Windows / iPads connectés au PC)
  // Vite n'existe plus. On utilise dynamiquement l'adresse IP saisie dans le navigateur.
  if (import.meta.env.PROD) {
    return window.location.origin; 
  }
  
  // En DÉVELOPPEMENT (Codespaces ou Local)
  // On utilise '/' pour exploiter le proxy interne de Vite (vite.config.js)
  // Cela permet de contourner les sécurités de ports de GitHub Codespaces.
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
        // Déclenchement d'une alarme globale interceptée par App.jsx
        const event = new CustomEvent('drm-lock', { 
          detail: { message: errorData.message, code: errorData.error } 
        });
        window.dispatchEvent(event);
      }
    }

    // La gestion des erreurs 401 (Expiration token) se fera ici plus tard
    return Promise.reject(error);
  }
);

export default api;