import { ProjetRepository } from '../repositories/projet.repository';
import { OFService } from './of.service';
import { DashboardKPIs } from '../models/types';

export const DashboardService = {
    async getKPIs(): Promise<DashboardKPIs> {
        const base = await ProjetRepository.getKPIsBase();
        const ofs_en_retard = await OFService.compterEnRetard();
        const avancement_par_service = await ProjetRepository.getAvancementParService();
        return {
            total_projets: base.total_projets,
            projets_en_cours: base.projets_en_cours,
            projets_en_retard: base.projets_en_retard,
            projets_termines: base.projets_termines,
            taux_avancement_global: base.taux_avancement_global,
            ofs_en_retard,
            avancement_par_service,
        };
    },

    async getAvancementParService() {
        return ProjetRepository.getAvancementParService();
    },
};
