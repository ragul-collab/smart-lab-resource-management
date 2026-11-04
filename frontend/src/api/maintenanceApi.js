import api from './axios';

export const createMaintenance = async (data) => {
  const response = await api.post('/maintenance', data);
  return response.data;
};

export const getMaintenance = async (params) => {
  const response = await api.get('/maintenance', { params });
  return response.data;
};

export const startMaintenance = async (id) => {
  const response = await api.patch(`/maintenance/${id}/status`, { status: 'IN_PROGRESS' });
  return response.data;
};

export const completeMaintenance = async (id, data) => {
  const response = await api.patch(`/maintenance/${id}/complete`, data);
  return response.data;
};
