// ============================================================
//  projetCode.ts — Formatage du code consolidé "YYYY-CCC-DDD"
//  aligné sur le libellé "Total Projet : 2026-052-018" du
//  modèle Excel de l'encadrant (cellule C35 / A35).
// ============================================================

import type { Projet } from '../types/models';

type ProjetCodeFields = Pick<
    Projet,
    'annee' | 'numero_client' | 'numero_dossier' | 'reference'
>;

export function formatProjetCode(p: ProjetCodeFields): string {
    if (p.annee && p.numero_client && p.numero_dossier) {
        return `${p.annee}-${String(p.numero_client).padStart(3, '0')}-${String(p.numero_dossier).padStart(3, '0')}`;
    }
    return p.reference;
}

export function formatTotalProjetLabel(p: ProjetCodeFields): string {
    return `Total Projet : ${formatProjetCode(p)}`;
}
