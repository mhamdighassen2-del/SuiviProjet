// ============================================================
//  projet.service.ts  —  Logique métier projets
//  Appelle ProjetRepository, applique les règles business
// ============================================================
import { ProjetRepository } from '../repositories/projet.repository';
import { SuiviService } from './suivi.service';
import { OFService } from './of.service';
import { HistoriqueService } from './historique.service';
import { CreateProjetDTO, Projet, UpdateProjetDTO, StatutProjet, SuiviService as SuiviServiceType } from '../models/types';

function snapshotProjet(p: Projet) {
    return {
        id: p.id,
        reference: p.reference,
        nom: p.nom,
        client: p.client,
        date_debut: p.date_debut,
        date_fin_prevue: p.date_fin_prevue,
        date_fin_reelle: p.date_fin_reelle,
        responsable_id: p.responsable_id,
        statut: p.statut,
        taux_avancement: p.taux_avancement,
    };
}

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

    async creerProjet(dto: CreateProjetDTO, responsable_id: string, actorId: string) {
        if (new Date(dto.date_debut) > new Date(dto.date_fin_prevue)) {
            throw new Error('La date de début doit être antérieure à la date de fin');
        }
        const created = await ProjetRepository.create(dto, responsable_id);
        const full = await ProjetRepository.findById(created.id);
        if (full) {
            await HistoriqueService.log({
                utilisateur_id: actorId,
                table_cible: 'projet',
                entite_id: full.id,
                action: 'INSERT',
                nouvelle_valeur: snapshotProjet(full),
            });
        }
        return full ?? created;
    },

    async modifierProjet(id: string, dto: UpdateProjetDTO, actorId: string) {
        const before = await ProjetRepository.findById(id);
        if (!before) throw new Error('Projet introuvable');
        const updated = await ProjetRepository.update(id, dto);
        if (!updated) throw new Error('Projet introuvable ou aucun champ à mettre à jour');
        const after = await ProjetRepository.findById(id);
        if (after) {
            await HistoriqueService.log({
                utilisateur_id: actorId,
                table_cible: 'projet',
                entite_id: id,
                action: 'UPDATE',
                ancienne_valeur: snapshotProjet(before),
                nouvelle_valeur: snapshotProjet(after),
            });
        }
        return after ?? updated;
    },

    async supprimerProjet(id: string, actorId: string) {
        const before = await ProjetRepository.findById(id);
        if (!before) throw new Error('Projet introuvable');
        await HistoriqueService.log({
            utilisateur_id: actorId,
            table_cible: 'projet',
            entite_id: id,
            action: 'DELETE',
            ancienne_valeur: snapshotProjet(before),
        });
        const deleted = await ProjetRepository.delete(id);
        if (!deleted) throw new Error('Projet introuvable');
    },
};
