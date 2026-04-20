// ============================================================
//  stores/auth.store.ts  —  État global authentification
// ============================================================
import { create } from 'zustand';
import { Utilisateur, RoleUtilisateur } from '../types/models';
import { api } from '../services/api';

interface AuthState {
    user: Utilisateur | null;
    token: string | null;
    isAuthenticated: boolean;

    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    /** Charge l’utilisateur depuis GET /api/auth/me si un JWT est présent */
    fetchSession: () => Promise<void>;
    hasRole: (...roles: RoleUtilisateur[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user:            null,
    token:           localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),

    login: async (email, password) => {
        const { data } = await api.post<{ token: string; user: Utilisateur }>(
            '/auth/login',
            { email, mot_de_passe: password }
        );
        localStorage.setItem('token', data.token);
        set({ user: data.user, token: data.token, isAuthenticated: true });
    },

    fetchSession: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ user: null, token: null, isAuthenticated: false });
            return;
        }
        try {
            const { data } = await api.get<{ data: Utilisateur }>('/auth/me');
            set({ user: data.data, token, isAuthenticated: true });
        } catch {
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
        window.location.href = '/login';
    },

    hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        const hierarchy: Record<RoleUtilisateur, number> = {
            UTILISATEUR: 1, RESPONSABLE_SERVICE: 2, CHEF_PROJET: 3, ADMIN: 4,
        };
        const minLevel = Math.min(...roles.map(r => hierarchy[r]));
        return hierarchy[user.role] >= minLevel;
    },
}));
