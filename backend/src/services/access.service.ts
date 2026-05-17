import { HttpError } from '../utils/http-error';
import { UtilisateurRepository } from '../repositories/utilisateur.repository';
import { SuiviRepository } from '../repositories/suivi.repository';
import { OFRepository } from '../repositories/of.repository';

export async function assertPeutModifierSuivi(actorId: string, suiviId: string): Promise<void> {
    const actor = await UtilisateurRepository.findAccessById(actorId);
    if (!actor) throw new Error('Utilisateur introuvable');
    if (actor.role === 'CHEF_PROJET' || actor.role === 'ADMIN') return;
    if (actor.role !== 'RESPONSABLE_SERVICE') {
        throw new HttpError(403, 'Accès refusé pour ce rôle.');
    }
    if (!actor.service_id) {
        throw new HttpError(
            403,
            'Aucun service n’est assigné à votre compte. Contactez un administrateur.'
        );
    }
    const suivi = await SuiviRepository.findById(suiviId);
    if (!suivi) throw new HttpError(404, 'Suivi introuvable');
    if (suivi.service_id !== actor.service_id) {
        throw new HttpError(403, 'Vous ne pouvez modifier que le suivi de votre service.');
    }
}

export async function assertPeutGererOFPourSuivi(actorId: string, suiviId: string): Promise<void> {
    await assertPeutModifierSuivi(actorId, suiviId);
}

export async function assertPeutModifierOF(actorId: string, ofId: string): Promise<void> {
    const actor = await UtilisateurRepository.findAccessById(actorId);
    if (!actor) throw new Error('Utilisateur introuvable');
    if (actor.role === 'CHEF_PROJET' || actor.role === 'ADMIN') return;
    if (actor.role !== 'RESPONSABLE_SERVICE') {
        throw new HttpError(403, 'Accès refusé pour ce rôle.');
    }
    if (!actor.service_id) {
        throw new HttpError(
            403,
            'Aucun service n’est assigné à votre compte. Contactez un administrateur.'
        );
    }
    const of = await OFRepository.findById(ofId);
    if (!of) throw new HttpError(404, 'OF introuvable');
    const suivi = await SuiviRepository.findById(of.suivi_service_id);
    if (!suivi) throw new HttpError(404, 'Suivi introuvable');
    if (suivi.service_id !== actor.service_id) {
        throw new HttpError(403, 'Vous ne pouvez modifier que les OF rattachés à votre service.');
    }
}
