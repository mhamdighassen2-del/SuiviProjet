import db from '../config/database';

export type HistoriqueRow = {
    id: string;
    utilisateur_id: string | null;
    table_cible: string;
    entite_id: string;
    action: string;
    ancienne_valeur: unknown;
    nouvelle_valeur: unknown;
    cree_le: Date;
};

function jsonForDb(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    return JSON.stringify(value, (_k, v) => (v instanceof Date ? v.toISOString() : v));
}

export const HistoriqueRepository = {
    async insert(params: {
        utilisateur_id: string | null;
        table_cible: string;
        entite_id: string;
        action: 'INSERT' | 'UPDATE' | 'DELETE';
        ancienne_valeur?: unknown;
        nouvelle_valeur?: unknown;
    }): Promise<void> {
        await db.query(
            `INSERT INTO historique (utilisateur_id, table_cible, entite_id, action, ancienne_valeur, nouvelle_valeur)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
            [
                params.utilisateur_id,
                params.table_cible,
                params.entite_id,
                params.action,
                jsonForDb(params.ancienne_valeur ?? null),
                jsonForDb(params.nouvelle_valeur ?? null),
            ]
        );
    },

    /** Journal lié à un projet : entité projet, suivis du projet, OF du projet */
    async findByProjetId(projetId: string, limit = 200): Promise<HistoriqueRow[]> {
        const { rows } = await db.query<HistoriqueRow>(
            `SELECT h.id, h.utilisateur_id, h.table_cible, h.entite_id, h.action,
                    h.ancienne_valeur, h.nouvelle_valeur, h.cree_le
             FROM historique h
             WHERE (h.table_cible = 'projet' AND h.entite_id = $1)
                OR (h.table_cible = 'suivi_service'
                    AND h.entite_id IN (SELECT id FROM suivi_service WHERE projet_id = $1))
                OR (h.table_cible = 'ordre_fabrication'
                    AND h.entite_id IN (SELECT id FROM ordre_fabrication WHERE projet_id = $1))
             ORDER BY h.cree_le DESC
             LIMIT $2`,
            [projetId, limit]
        );
        return rows;
    },
};
