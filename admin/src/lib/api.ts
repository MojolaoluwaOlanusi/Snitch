import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4500/api',
  withCredentials: true
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  return config;
});

export default api;
