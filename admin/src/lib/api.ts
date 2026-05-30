import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4500/api/',
  withCredentials: true
});

// Do NOT hardcode secrets in source. Use setAuthToken at runtime or rely on the request interceptor
export function setAuthToken(token?: string) {
  if (token) {
    try { localStorage.setItem('adminToken', token); } catch (e) { /* ignore in non-browser env */ }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    try { localStorage.removeItem('adminToken'); } catch (e) { /* ignore */ }
    delete api.defaults.headers.common['Authorization'];
  }
}

// Per-request interceptor: prefer runtime token from localStorage (keeps bundle free of committed tokens)
api.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('adminToken');
    if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  } catch (e) {
    // localStorage might not be available in some environments
  }
  return config;
});

export default api;
