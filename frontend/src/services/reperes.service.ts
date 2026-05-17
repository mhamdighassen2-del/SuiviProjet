import { api } from './api';
import { Repere, CreateRepereDTO, UpdateRepereDTO } from '../types/models';

export const reperesService = {
    getByProjet: (projetId: string) =>
        api.get<{ data: Repere[] }>(`/projets/${projetId}/reperes`).then((r) => r.data.data),

    getStats: (projetId: string) =>
        api.get<{ data: RepereStats }>(`/projets/${projetId}/reperes/stats`).then((r) => r.data.data),

    create: (projetId: string, dto: CreateRepereDTO) =>
        api.post<{ data: Repere }>(`/projets/${projetId}/reperes`, dto).then((r) => r.data.data),

    update: (id: string, dto: UpdateRepereDTO) =>
        api.put<{ data: Repere }>(`/reperes/${id}`, dto).then((r) => r.data.data),

    delete: (id: string) =>
        api.delete(`/reperes/${id}`),
};

export interface RepereStats {
    total: number;
    planifie: number;
    en_cours: number;
    cloture: number;
    temps_total: number;
    temps_fait: number;
    taux_avancement: number;
}
