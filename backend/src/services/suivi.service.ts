import { SuiviRepository } from '../repositories/suivi.repository';
import { HistoriqueService } from './historique.service';
import { assertPeutModifierSuivi } from './access.service';
import { recalculerStatutProjetApresSuivi } from './projet-statut.util';
import { SuiviService as SuiviType, UpdateSuiviDTO } from '../models/types';

function snapshotSuivi(s: SuiviType) {
    return {
        id: s.id,
        projet_id: s.projet_id,
        service_id: s.service_id,
        taux_avancement: s.taux_avancement,
        statut: s.statut,
        commentaire: s.commentaire,
        blocage: s.blocage,
        date_debut_reelle: s.date_debut_reelle,
        date_fin_reelle: s.date_fin_reelle,
    };
}

export const SuiviService = {
    async listerParProjet(projetId: string) {
        return SuiviRepository.findByProjet(projetId);
    },

    async mettreAJour(id: string, dto: UpdateSuiviDTO, actorId: string) {
        const before = await SuiviRepository.findById(id);
        if (!before) throw new Error('Suivi introuvable');
        await assertPeutModifierSuivi(actorId, id);

        const statutFinal = dto.statut !== undefined ? dto.statut : before.statut;
        let finReelle: string | null | undefined;
        if (dto.date_fin_reelle !== undefined) {
            const v = dto.date_fin_reelle;
            finReelle =
                v === null || (typeof v === 'string' && v.trim() === '') ? null : String(v);
        } else {
            finReelle = before.date_fin_reelle;
        }
        if (finReelle && statutFinal !== 'TERMINE') {
            throw new Error(
                'La date de fin réelle ne peut être renseignée que lorsque le statut du suivi est « Terminé ».'
            );
        }

        const updated = await SuiviRepository.update(id, dto);
        if (!updated) throw new Error('Suivi introuvable');
        await HistoriqueService.log({
            utilisateur_id: actorId,
            table_cible: 'suivi_service',
            entite_id: id,
            action: 'UPDATE',
            ancienne_valeur: snapshotSuivi(before),
            nouvelle_valeur: snapshotSuivi(updated),
        });
        await recalculerStatutProjetApresSuivi(before.projet_id);
        return updated;
    },
};
