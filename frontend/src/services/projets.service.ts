// ============================================================
//  services/projets.service.ts
// ============================================================
import { api } from './api';
import {
    Projet, SuiviService, OrdreFabrication,
    CreateProjetDTO, UpdateProjetDTO,
    UpdateSuiviDTO, CreateOFDTO, UpdateOFDTO,
    DashboardKPIs, StatutProjet,
    HistoriqueEntree,
} from '../types/models';

// ── Projets ──────────────────────────────────────────────────

export const projetsService = {
    getAll: (params?: { statut?: StatutProjet; date_debut?: string; date_fin?: string }) =>
        api.get<{ data: Projet[] }>('/projets', { params }).then(r => r.data.data),

    getById: (id: string) =>
        api.get<{ data: Projet }>(`/projets/${id}`).then(r => r.data.data),

    create: (dto: CreateProjetDTO) =>
        api.post<{ data: Projet }>('/projets', dto).then(r => r.data.data),

    update: (id: string, dto: UpdateProjetDTO) =>
        api.put<{ data: Projet }>(`/projets/${id}`, dto).then(r => r.data.data),

    delete: (id: string) =>
        api.delete<{ message: string }>(`/projets/${encodeURIComponent(id)}`).then((r) => r.data),

    getHistorique: (id: string) =>
        api.get<{ data: HistoriqueEntree[] }>(`/projets/${id}/historique`).then((r) => r.data.data),
};

// ── Suivis service ───────────────────────────────────────────

export const suiviService = {
    getByProjet: (projetId: string) =>
        api.get<{ data: SuiviService[] }>(`/projets/${projetId}/suivis`).then(r => r.data.data),

    getById: (id: string) =>
        api.get<{ data: SuiviService }>(`/suivis/${id}`).then(r => r.data.data),

    update: (id: string, dto: UpdateSuiviDTO) =>
        api.put<{ data: SuiviService }>(`/suivis/${id}`, dto).then(r => r.data.data),

    uploadDocument: (id: string, file: File) => {
        const form = new FormData();
        form.append('fichier', file);
        return api.post(`/suivis/${id}/documents`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// ── Ordres de Fabrication ────────────────────────────────────

export const ofService = {
    getAll: () =>
        api.get<{ data: OrdreFabrication[] }>('/ofs').then(r => r.data.data),

    getBySuivi: (suiviId: string) =>
        api.get<{ data: OrdreFabrication[] }>(`/suivis/${suiviId}/ofs`).then(r => r.data.data),

    getById: (id: string) =>
        api.get<{ data: OrdreFabrication }>(`/ofs/${id}`).then(r => r.data.data),

    getEnRetard: () =>
        api.get<{ data: OrdreFabrication[] }>('/ofs/en-retard').then(r => r.data.data),

    create: (suiviId: string, dto: CreateOFDTO & { projet_id: string }) =>
        api.post<{ data: OrdreFabrication }>(`/suivis/${suiviId}/ofs`, dto).then(r => r.data.data),

    update: (id: string, dto: UpdateOFDTO) =>
        api.put<{ data: OrdreFabrication }>(`/ofs/${id}`, dto).then(r => r.data.data),

    delete: (id: string) =>
        api.delete(`/ofs/${id}`),
};

// ── Dashboard ────────────────────────────────────────────────

export const dashboardService = {
    getKPIs: () =>
        api.get<{ data: DashboardKPIs }>('/dashboard/kpis').then(r => r.data.data),

    getAvancementParService: () =>
        api.get('/dashboard/avancement-par-service').then(r => r.data.data),
};

// ── Rapports ─────────────────────────────────────────────────

export const rapportService = {
    exportProjetPDF:   (id: string) => api.get(`/rapports/projet/${id}/pdf`,   { responseType: 'blob' }),
    exportProjetExcel: (id: string) => api.get(`/rapports/projet/${id}/excel`, { responseType: 'blob' }),
    exportOFsExcel:    ()           => api.get('/rapports/ofs/excel',           { responseType: 'blob' }),
};
