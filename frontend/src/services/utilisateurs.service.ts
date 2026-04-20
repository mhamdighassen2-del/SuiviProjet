import { api } from './api';
import { Utilisateur, CreateUtilisateurDTO, UpdateUtilisateurDTO } from '../types/models';

export const utilisateursService = {
    getAll: () => api.get<{ data: Utilisateur[] }>('/utilisateurs').then((r) => r.data.data),

    getById: (id: string) => api.get<{ data: Utilisateur }>(`/utilisateurs/${id}`).then((r) => r.data.data),

    create: (dto: CreateUtilisateurDTO) =>
        api.post<{ data: Utilisateur }>('/utilisateurs', dto).then((r) => r.data.data),

    update: (id: string, dto: UpdateUtilisateurDTO) =>
        api.put<{ data: Utilisateur }>(`/utilisateurs/${id}`, dto).then((r) => r.data.data),

    desactiver: (id: string) =>
        api.patch<{ data: Utilisateur }>(`/utilisateurs/${id}/desactiver`).then((r) => r.data.data),
};
