import api from './api';

export const paymentService = {
  getAll: async () => {
    const response = await api.get('/api/payments');
    return response.data;
  },

  getActive: async () => {
    const response = await api.get('/api/payments/active');
    return response.data;
  },

  create: async (paymentData) => {
    const response = await api.post('/api/payments', paymentData);
    return response.data;
  },

  update: async (id, paymentData) => {
    const response = await api.put(`/api/payments/${id}`, paymentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/payments/${id}`);
    return response.data;
  }
};