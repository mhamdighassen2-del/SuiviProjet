import { ProjetRepository } from '../repositories/projet.repository';
import { SuiviRepository } from '../repositories/suivi.repository';
import { StatutProjet, SuiviService } from '../models/types';

/** Déduit le statut projet à partir des suivis (aligné sur docs/business-rules.md). */
export function computeStatutProjet(suivis: SuiviService[], dateFinPrevue: string): StatutProjet {
    if (suivis.length === 0) return 'NON_DEMARRE';
    const allTermine = suivis.every((s) => s.statut === 'TERMINE' && s.taux_avancement >= 100);
    if (allTermine) return 'TERMINE';
    if (suivis.every((s) => s.statut === 'NON_DEMARRE')) return 'NON_DEMARRE';
    const today = new Date().toISOString().slice(0, 10);
    if (dateFinPrevue < today) return 'EN_RETARD';
    return 'EN_COURS';
}

/** Recalcule et persiste le statut projet après une mise à jour de suivi. */
export async function recalculerStatutProjetApresSuivi(projetId: string): Promise<void> {
    const projet = await ProjetRepository.findById(projetId);
    if (!projet) return;
    const suivis = await SuiviRepository.findByProjet(projetId);
    const next = computeStatutProjet(suivis, projet.date_fin_prevue);
    if (next !== projet.statut) {
        await ProjetRepository.update(projetId, { statut: next });
    }
}
