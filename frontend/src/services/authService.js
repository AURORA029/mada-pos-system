import api from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';

export const authService = {
  login: async (password) => {
    // Appel à notre nouvelle route backend
    const response = await api.post(`${API_ENDPOINTS.AUTH}/login`, { password });
    
    // Si le backend renvoie un token, on le stocke proprement
    if (response.data && response.data.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    }
    
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
};