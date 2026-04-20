// ============================================================
//  stores/projets.store.ts  —  État global projets
// ============================================================
import { create } from 'zustand';
import { Projet, StatutProjet } from '../types/models';
import { projetsService } from '../services/projets.service';

interface ProjetsState {
    projets: Projet[];
    projetCourant: Projet | null;
    isLoading: boolean;
    error: string | null;

    charger: (filters?: {
        statut?: StatutProjet;
        date_debut?: string;
        date_fin?: string;
    }) => Promise<void>;
    chargerProjet: (id: string) => Promise<void>;
    reset: () => void;
}

export const useProjetsStore = create<ProjetsState>((set) => ({
    projets:       [],
    projetCourant: null,
    isLoading:     false,
    error:         null,

    charger: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            const projets = await projetsService.getAll(filters);
            set({ projets, isLoading: false });
        } catch (e) {
            set({ error: (e as Error).message, isLoading: false });
        }
    },

    chargerProjet: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const projet = await projetsService.getById(id);
            set({ projetCourant: projet, isLoading: false });
        } catch (e) {
            set({ error: (e as Error).message, isLoading: false });
        }
    },

    reset: () => set({ projets: [], projetCourant: null, error: null }),
}));
