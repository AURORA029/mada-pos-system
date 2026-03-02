import api from './api';

export const menuService = {
  getCategories: async () => {
    const response = await api.get('/api/menu/categories');
    return response.data;
  },
  
  addCategory: async (name) => {
    const response = await api.post('/api/menu/categories', { name });
    return response.data;
  },

  getItems: async () => {
    const response = await api.get('/api/menu/items');
    return response.data;
  },

  addItem: async (formData) => {
    // Le Content-Type multipart/form-data est requis pour l'upload d'image
    const response = await api.post('/api/menu/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await api.delete(`/api/menu/items/${id}`);
    return response.data;
  },

  toggleAvailability: async (id, isAvailable) => {
    const response = await api.patch(`/api/menu/items/${id}/availability`, { is_available: isAvailable });
    return response.data;
  }
};