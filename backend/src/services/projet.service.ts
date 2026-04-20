// ============================================================
//  projet.service.ts  —  Logique métier projets
//  Appelle ProjetRepository, applique les règles business
// ============================================================
import { ProjetRepository } from '../repositories/projet.repository';
import { SuiviService } from './suivi.service';
import { OFService } from './of.service';
import { CreateProjetDTO, UpdateProjetDTO, StatutProjet, SuiviService as SuiviServiceType } from '../models/types';

async function enrichSuivisAvecOF(suivis: SuiviServiceType[]) {
    for (const suivi of suivis) {
        const nom = suivi.service?.nom;
        if (nom === 'METHODES' || nom === 'PRODUCTION') {
            suivi.ordres_fabrication = await OFService.listerParSuivi(suivi.id);
        }
    }
    return suivis;
}

export const ProjetService = {

    async listerProjets(filters?: { statut?: StatutProjet; date_debut?: string; date_fin?: string }) {
        return ProjetRepository.findAll(filters);
    },

    async listerSuivisProjet(projetId: string) {
        const suivis = await SuiviService.listerParProjet(projetId);
        return enrichSuivisAvecOF(suivis);
    },

    async getProjet(id: string) {
        const projet = await ProjetRepository.findById(id);
        if (!projet) throw new Error('Projet introuvable');
        const suivis = await SuiviService.listerParProjet(id);
        await enrichSuivisAvecOF(suivis);
        return { ...projet, suivis };
    },

    async creerProjet(dto: CreateProjetDTO, responsable_id: string) {
        // Règle : date_debut <= date_fin_prevue (double vérif applicative)
        if (new Date(dto.date_debut) > new Date(dto.date_fin_prevue)) {
            throw new Error('La date de début doit être antérieure à la date de fin');
        }
        return ProjetRepository.create(dto, responsable_id);
    },

    async modifierProjet(id: string, dto: UpdateProjetDTO) {
        const updated = await ProjetRepository.update(id, dto);
        if (!updated) throw new Error('Projet introuvable ou aucun champ à mettre à jour');
        return updated;
    },

    async supprimerProjet(id: string) {
        const deleted = await ProjetRepository.delete(id);
        if (!deleted) throw new Error('Projet introuvable');
    },
};
