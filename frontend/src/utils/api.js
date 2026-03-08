import axios from 'axios';
import { useAppStore } from '../store/useAppStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
    const token = useAppStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor to handle errors, maybe logout on 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token probably expired
            useAppStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default api;
