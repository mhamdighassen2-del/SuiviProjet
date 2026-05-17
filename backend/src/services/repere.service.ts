import { RepereRepository } from '../repositories/repere.repository';
import { CreateRepereDTO, UpdateRepereDTO } from '../models/types';
import { ProjetRepository } from '../repositories/projet.repository';
import { CAUSES_RETARD, isCauseRetardValide } from '../models/causes-retard';
import { HttpError } from '../utils/http-error';

function buildCode(annee: number, numeroClient: number, numeroDossier: number, ordre: number): string {
    const yy  = String(annee).slice(-2);
    const ccc = String(numeroClient).padStart(3, '0');
    const ddd = String(numeroDossier).padStart(3, '0');
    const sss = String(ordre).padStart(3, '0');
    return `${yy}-${ccc}-${ddd}-${sss}`;
}

function validerCauseRetard(dto: CreateRepereDTO | UpdateRepereDTO): void {
    // Le DTO est typé strict (`CauseRetard | null | undefined`) côté TS, mais l'API
    // peut recevoir `""` depuis un <select> non rempli côté frontend — on élargit
    // donc volontairement à `unknown` pour pouvoir trapper ce cas.
    const v = dto.cause_retard as unknown;
    if (v === undefined || v === null || v === '') return;
    if (!isCauseRetardValide(v)) {
        throw new HttpError(
            400,
            `Cause de retard invalide : "${String(v)}". Valeurs autorisées : ${CAUSES_RETARD.join(', ')}.`
        );
    }
}

export const RepereService = {
    async listerParProjet(projetId: string) {
        const projet = await ProjetRepository.findById(projetId);
        if (!projet) throw new HttpError(404, 'Projet introuvable');
        return RepereRepository.findByProjet(projetId);
    },

    async creer(projetId: string, dto: CreateRepereDTO) {
        validerCauseRetard(dto);

        const projet = await ProjetRepository.findById(projetId);
        if (!projet) throw new HttpError(404, 'Projet introuvable');

        const ordre = await RepereRepository.getNextOrdre(projetId);

        let code: string;
        if (projet.annee && projet.numero_client && projet.numero_dossier) {
            code = buildCode(projet.annee, projet.numero_client, projet.numero_dossier, ordre);
        } else {
            code = `${projet.reference}-${String(ordre).padStart(3, '0')}`;
        }

        return RepereRepository.create(projetId, dto, code, ordre);
    },

    async modifier(id: string, dto: UpdateRepereDTO) {
        validerCauseRetard(dto);

        const existing = await RepereRepository.findById(id);
        if (!existing) throw new HttpError(404, 'Repère introuvable');
        const updated = await RepereRepository.update(id, dto);
        if (!updated) throw new HttpError(500, 'Mise à jour impossible');
        return updated;
    },

    async supprimer(id: string) {
        const existing = await RepereRepository.findById(id);
        if (!existing) throw new HttpError(404, 'Repère introuvable');
        const ok = await RepereRepository.delete(id);
        if (!ok) throw new HttpError(500, 'Suppression impossible');
    },

    async getStats(projetId: string) {
        return RepereRepository.getStats(projetId);
    },
};
