// ============================================================
//  Causes de retard — liste fermée alignée sur le modèle Excel
//  de l'encadrant (feuille "Listes" du fichier modèle).
//
//  Doit rester strictement synchrone avec :
//   - le type ENUM PostgreSQL `cause_retard_enum`
//     (migration 008_causes_retard_enum.sql)
//   - la constante frontend `frontend/src/constants/causesRetard.ts`
// ============================================================

export const CAUSES_RETARD = [
    'ATT ST/ACHAT',
    'ATT BC',
    'ATT PRODUIT CLIENT',
    'Att retour client',
    'CAPACITE',
    'Replanifié par le client',
    'En pause par le client',
    'Retard matière',
    'Problème qualité',
    'Problème technique',
    'Manque ressource',
    'Sous-traitance',
    'En attente validation',
    'Autre',
] as const;

export type CauseRetard = typeof CAUSES_RETARD[number];

export function isCauseRetardValide(value: unknown): value is CauseRetard {
    return typeof value === 'string' && (CAUSES_RETARD as readonly string[]).includes(value);
}
