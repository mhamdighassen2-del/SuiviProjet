import { OFRepository } from '../repositories/of.repository';
import { CreateOFDTO, UpdateOFDTO } from '../models/types';

export const OFService = {
    async listerTous(limit?: number) {
        return OFRepository.findAll(limit);
    },

    async listerEnRetard() {
        return OFRepository.findEnRetard();
    },

    async getById(id: string) {
        return OFRepository.findById(id);
    },

    async listerParSuivi(suiviId: string) {
        return OFRepository.findBySuivi(suiviId);
    },

    async creer(suiviId: string, projetId: string, dto: CreateOFDTO) {
        return OFRepository.create(suiviId, projetId, dto);
    },

    async mettreAJour(id: string, dto: UpdateOFDTO) {
        return OFRepository.update(id, dto);
    },

    async supprimer(id: string) {
        return OFRepository.delete(id);
    },

    async compterEnRetard() {
        return OFRepository.countEnRetard();
    },
};
