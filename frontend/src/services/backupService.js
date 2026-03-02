import api from './api';

export const backupService = {
  downloadDatabase: async () => {
    const response = await api.get('/api/backup/download', {
      responseType: 'blob'
    });
    return response.data;
  }
};