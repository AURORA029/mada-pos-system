import api from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../utils/constants';

export const authService = {
  login: async (password) => {
    const response = await api.post(`${API_ENDPOINTS.AUTH}/login`, { password });
    if (response.data && response.data.token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  checkSetupStatus: async () => {
    const response = await api.get(`${API_ENDPOINTS.AUTH}/setup-status`);
    return response.data;
  },

  setup: async (restaurantName, password) => {
    const response = await api.post(`${API_ENDPOINTS.AUTH}/setup`, { restaurantName, password });
    return response.data;
  }
};