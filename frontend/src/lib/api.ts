// frontend/src/lib/api.ts
import axios from 'axios';

// @ts-ignore
const api = axios.create({
    baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:4500/api',
    withCredentials: true,
});

// auth token helper
export function setAuthToken(token: string | null) {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
}

export default api;
