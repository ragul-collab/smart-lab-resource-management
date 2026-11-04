import api from './axios';

export const getEquipment = async (params) => {
  const response = await api.get('/equipment', { params });
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/equipment/categories');
  return response.data;
};

export const getByCode = async (code) => {
  const response = await api.get(`/equipment/code/${encodeURIComponent(code)}`);
  return response.data;
};

export const createEquipment = async (data) => {
  const response = await api.post('/equipment', data);
  return response.data;
};

export const updateEquipment = async (id, data) => {
  const response = await api.put(`/equipment/${id}`, data);
  return response.data;
};

export const deleteEquipment = async (id) => {
  const response = await api.delete(`/equipment/${id}`);
  return response.data;
};

export const getQr = async (id) => {
  const response = await api.get(`/equipment/${id}/qr`);
  return response.data;
};
