import db from '../config/database';
import { OrdreFabrication, CreateOFDTO, UpdateOFDTO } from '../models/types';

// ============================================================
//  OFRepository  —  Requêtes SQL sur "ordre_fabrication"
// ============================================================

export const OFRepository = {

    async findAll(limit = 500): Promise<OrdreFabrication[]> {
        const { rows } = await db.query<OrdreFabrication>(
            `SELECT of.*,
                    CASE WHEN of.date_fin_prevue < CURRENT_DATE AND of.etat != 'TERMINE'
                         THEN CURRENT_DATE - of.date_fin_prevue
                         ELSE 0 END AS jours_retard
             FROM ordre_fabrication of
             ORDER BY of.date_lancement DESC
             LIMIT $1`,
            [limit]
        );
        return rows;
    },

    /** Liste OF avec nom de projet (exports). */
    async findAllForExport(limit = 2000): Promise<(OrdreFabrication & { projet_nom: string })[]> {
        const { rows } = await db.query(
            `SELECT of.*,
                    CASE WHEN of.date_fin_prevue < CURRENT_DATE AND of.etat != 'TERMINE'
                         THEN CURRENT_DATE - of.date_fin_prevue
                         ELSE 0 END AS jours_retard,
                    p.nom AS projet_nom
             FROM ordre_fabrication of
             JOIN projet p ON p.id = of.projet_id
             ORDER BY of.date_lancement DESC
             LIMIT $1`,
            [limit]
        );
        return rows as (OrdreFabrication & { projet_nom: string })[];
    },

    // Lister les OF d'un suivi
    async findBySuivi(suivi_service_id: string): Promise<OrdreFabrication[]> {
        const { rows } = await db.query<OrdreFabrication>(
            `SELECT of.*,
                    CASE WHEN of.date_fin_prevue < CURRENT_DATE AND of.etat != 'TERMINE'
                         THEN CURRENT_DATE - of.date_fin_prevue
                         ELSE 0 END AS jours_retard
             FROM ordre_fabrication of
             WHERE of.suivi_service_id = $1
             ORDER BY of.date_lancement`,
            [suivi_service_id]
        );
        return rows;
    },

    // OF en retard (tous services confondus)
    async findEnRetard(): Promise<OrdreFabrication[]> {
        const { rows } = await db.query<OrdreFabrication>(
            `SELECT * FROM v_ofs_en_retard`
        );
        return rows;
    },

    // Trouver par ID
    async findById(id: string): Promise<OrdreFabrication | null> {
        const { rows } = await db.query<OrdreFabrication>(
            `SELECT * FROM ordre_fabrication WHERE id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    // Créer (le trigger DB vérifie que c'est bien Méthodes/Production)
    async create(
        suivi_service_id: string,
        projet_id: string,
        dto: CreateOFDTO
    ): Promise<OrdreFabrication> {
        const { rows } = await db.query<OrdreFabrication>(
            `INSERT INTO ordre_fabrication
                (numero_of, suivi_service_id, projet_id, designation, date_lancement, date_fin_prevue, commentaire)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [dto.numero_of, suivi_service_id, projet_id, dto.designation,
             dto.date_lancement, dto.date_fin_prevue, dto.commentaire ?? null]
        );
        return rows[0];
    },

    // Mettre à jour
    async update(id: string, dto: UpdateOFDTO): Promise<OrdreFabrication | null> {
        const fields: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (dto.designation)    { fields.push(`designation = $${i++}`);    values.push(dto.designation); }
        if (dto.date_fin_prevue){ fields.push(`date_fin_prevue = $${i++}`); values.push(dto.date_fin_prevue); }
        if (dto.date_fin_reelle){ fields.push(`date_fin_reelle = $${i++}`); values.push(dto.date_fin_reelle); }
        if (dto.etat)           { fields.push(`etat = $${i++}`);            values.push(dto.etat); }
        if (dto.taux_avancement !== undefined) {
            fields.push(`taux_avancement = $${i++}`);
            values.push(dto.taux_avancement);
        }
        if (dto.commentaire !== undefined) { fields.push(`commentaire = $${i++}`); values.push(dto.commentaire); }

        if (!fields.length) return null;
        values.push(id);

        const { rows } = await db.query<OrdreFabrication>(
            `UPDATE ordre_fabrication SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            values
        );
        return rows[0] || null;
    },

    // Supprimer
    async delete(id: string): Promise<boolean> {
        const { rowCount } = await db.query(
            `DELETE FROM ordre_fabrication WHERE id = $1`, [id]
        );
        return (rowCount ?? 0) > 0;
    },

    // Compter les OF en retard (pour KPI dashboard)
    async countEnRetard(): Promise<number> {
        const { rows } = await db.query(
            `SELECT COUNT(*) AS total FROM v_ofs_en_retard`
        );
        return Number(rows[0].total);
    },
};
