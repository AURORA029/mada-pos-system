import api from './api';

export const closingService = {
  performClosing: async (closingData) => {
    const response = await api.post('/api/closings', closingData);
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/api/closings/history');
    return response.data;
  },
  getMonthlyStats: async (year) => {
    const response = await api.get(`/api/closings/monthly?year=${year}`);
    return response.data;
  },
  getKPIs: async () => {
    const response = await api.get('/api/closings/kpis');
    return response.data;
  }
};