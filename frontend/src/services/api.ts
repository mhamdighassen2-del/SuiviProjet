// ============================================================
//  services/api.ts  —  Client HTTP centralisé
// ============================================================
import axios, { isAxiosError } from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: { 'Content-Type': 'application/json' },
});

// Injecte le JWT à chaque requête
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Redirige vers /login si 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export function getApiErrorMessage(err: unknown, fallback: string): string {
    if (!isAxiosError(err)) return fallback;
    const d = err.response?.data;
    if (d && typeof d === 'object' && 'message' in d && typeof (d as { message: string }).message === 'string') {
        return (d as { message: string }).message;
    }
    const status = err.response?.status;
    if (status === 403) return 'Accès non autorisé.';
    if (status === 401) return 'Session expirée ou non authentifié.';
    return fallback;
}
