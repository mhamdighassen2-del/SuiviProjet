import { SuiviRepository } from '../repositories/suivi.repository';
import { UpdateSuiviDTO } from '../models/types';

export const SuiviService = {
    async listerParProjet(projetId: string) {
        return SuiviRepository.findByProjet(projetId);
    },

    async mettreAJour(id: string, dto: UpdateSuiviDTO) {
        const updated = await SuiviRepository.update(id, dto);
        if (!updated) throw new Error('Suivi introuvable');
        return updated;
    },
};
