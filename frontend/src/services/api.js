import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// Création d'une instance Axios dédiée
const api = axios.create({
  baseURL: '/', // Le proxy Vite gère le routage vers localhost:5000
  timeout: 10000, // Fail-fast: 10s max pour éviter de bloquer la caisse
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de Requête : Injection automatique du token (Préparation Étape 1)
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

// Intercepteur de Réponse : Gestion centralisée des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API Error]', error.response?.data || error.message);
    // La gestion des erreurs 401 (Expiration token) se fera ici
    return Promise.reject(error);
  }
);

export default api;