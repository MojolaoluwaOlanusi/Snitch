import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4500/api/',
  withCredentials: true
});

const accessToken = '8faf706b7031dec317d2b87357ab5bb179a11ed0e4ee1874d4f272be0f0c6f25bdd944d5024fa7546c5d9dbedd3c5e859ab06c6c54379095cb9e052e3b19f203';
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  return config;
});

export default api;
