import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

// In production (Railway), frontend and backend are served from same origin
// so we use relative /api path. In dev, use VITE_API_URL or localhost.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
    const token = useAppStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor to handle errors
// DO NOT auto-logout on 401 — let the Authenticator handle it
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
