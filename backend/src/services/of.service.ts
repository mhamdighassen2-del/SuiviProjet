import { OFRepository } from '../repositories/of.repository';
import { ProjetRepository } from '../repositories/projet.repository';
import { HistoriqueService } from './historique.service';
import { assertPeutGererOFPourSuivi, assertPeutModifierOF } from './access.service';
import { CreateOFDTO, UpdateOFDTO } from '../models/types';

function snapshotOF(o: Record<string, unknown>) {
    return {
        id: o.id,
        numero_of: o.numero_of,
        suivi_service_id: o.suivi_service_id,
        projet_id: o.projet_id,
        designation: o.designation,
        date_lancement: o.date_lancement,
        date_fin_prevue: o.date_fin_prevue,
        date_fin_reelle: o.date_fin_reelle,
        etat: o.etat,
        taux_avancement: o.taux_avancement,
        commentaire: o.commentaire,
    };
}

export const OFService = {
    async listerTous(limit?: number) {
        return OFRepository.findAll(limit);
    },

    async listerPourExportExcel(limit = 2000) {
        return OFRepository.findAllForExport(limit);
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

    async creer(suiviId: string, projetId: string, dto: CreateOFDTO, actorId: string) {
        await assertPeutGererOFPourSuivi(actorId, suiviId);
        const projet = await ProjetRepository.findById(projetId);
        if (!projet) throw new Error('Projet introuvable');
        if (dto.date_lancement < projet.date_debut) {
            throw new Error(
                'La date de lancement de l’OF ne peut pas être antérieure à la date de début du projet.'
            );
        }
        const created = await OFRepository.create(suiviId, projetId, dto);
        await HistoriqueService.log({
            utilisateur_id: actorId,
            table_cible: 'ordre_fabrication',
            entite_id: created.id,
            action: 'INSERT',
            nouvelle_valeur: snapshotOF(created as unknown as Record<string, unknown>),
        });
        return created;
    },

    async mettreAJour(id: string, dto: UpdateOFDTO, actorId: string) {
        await assertPeutModifierOF(actorId, id);
        const before = await OFRepository.findById(id);
        if (!before) return null;
        const updated = await OFRepository.update(id, dto);
        if (!updated) return null;
        await HistoriqueService.log({
            utilisateur_id: actorId,
            table_cible: 'ordre_fabrication',
            entite_id: id,
            action: 'UPDATE',
            ancienne_valeur: snapshotOF(before as unknown as Record<string, unknown>),
            nouvelle_valeur: snapshotOF(updated as unknown as Record<string, unknown>),
        });
        return updated;
    },

    async supprimer(id: string, actorId: string) {
        const before = await OFRepository.findById(id);
        if (!before) return false;
        const ok = await OFRepository.delete(id);
        if (ok) {
            await HistoriqueService.log({
                utilisateur_id: actorId,
                table_cible: 'ordre_fabrication',
                entite_id: id,
                action: 'DELETE',
                ancienne_valeur: snapshotOF(before as unknown as Record<string, unknown>),
            });
        }
        return ok;
    },

    async compterEnRetard() {
        return OFRepository.countEnRetard();
    },
};
