import api from './axios';

export const requestEquipment = async (data) => {
  const response = await api.post('/transactions/request', data);
  return response.data;
};

export const getMyTransactions = async (params) => {
  const response = await api.get('/transactions/my', { params });
  return response.data;
};

export const cancelRequest = async (id) => {
  const response = await api.patch(`/transactions/${id}/cancel`);
  return response.data;
};

export const requestReturn = async (id) => {
  const response = await api.patch(`/transactions/${id}/return-request`);
  return response.data;
};

export const getAllTransactions = async (params) => {
  const response = await api.get('/transactions', { params });
  return response.data;
};

export const approve = async (id) => {
  const response = await api.patch(`/transactions/${id}/approve`);
  return response.data;
};

export const reject = async (id, reason) => {
  const response = await api.patch(`/transactions/${id}/reject`, { reason });
  return response.data;
};

export const confirmReturn = async (id, data) => {
  const response = await api.patch(`/transactions/${id}/confirm-return`, data);
  return response.data;
};
