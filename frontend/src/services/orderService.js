import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

export const orderService = {
  // Récupérer toutes les commandes actives
  getAllOrders: async () => {
    const response = await api.get(API_ENDPOINTS.ORDERS);
    return response.data;
  },

  // Mettre à jour le statut d'une commande
  updateStatus: async (id, status) => {
    const response = await api.put(`${API_ENDPOINTS.ORDERS}/${id}/status`, { status });
    return response.data;
  }
};