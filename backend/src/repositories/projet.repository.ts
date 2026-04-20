import db from '../config/database';
import { Projet, CreateProjetDTO, UpdateProjetDTO, StatutProjet, Utilisateur, NomService } from '../models/types';

// ============================================================
//  ProjetRepository  —  Toutes les requêtes SQL sur "projet"
// ============================================================

function mapUtilisateur(row: {
    resp_id: string;
    resp_nom: string;
    resp_prenom: string;
    resp_email: string;
    resp_role: string;
    resp_actif: boolean;
    resp_cree_le: Date;
}): Utilisateur {
    return {
        id: row.resp_id,
        nom: row.resp_nom,
        prenom: row.resp_prenom,
        email: row.resp_email,
        role: row.resp_role as Utilisateur['role'],
        actif: row.resp_actif,
        cree_le: row.resp_cree_le,
    };
}

function mapProjetRow(row: Record<string, unknown>): Projet {
    const r = row as {
        id: string;
        reference: string;
        nom: string;
        client: string;
        date_debut: string;
        date_fin_prevue: string;
        date_fin_reelle?: string;
        responsable_id: string;
        statut: StatutProjet;
        taux_avancement: number;
        cree_le: Date;
        mis_a_jour_le: Date;
        resp_id?: string;
        resp_nom?: string;
        resp_prenom?: string;
        resp_email?: string;
        resp_role?: string;
        resp_actif?: boolean;
        resp_cree_le?: Date;
    };
    return {
        id: r.id,
        reference: r.reference,
        nom: r.nom,
        client: r.client,
        date_debut: r.date_debut,
        date_fin_prevue: r.date_fin_prevue,
        date_fin_reelle: r.date_fin_reelle,
        responsable_id: r.responsable_id,
        statut: r.statut,
        taux_avancement: Number(r.taux_avancement),
        cree_le: r.cree_le,
        mis_a_jour_le: r.mis_a_jour_le,
        responsable:
            r.resp_id && r.resp_nom && r.resp_prenom && r.resp_email && r.resp_role
                ? mapUtilisateur({
                      resp_id: r.resp_id,
                      resp_nom: r.resp_nom,
                      resp_prenom: r.resp_prenom,
                      resp_email: r.resp_email,
                      resp_role: r.resp_role,
                      resp_actif: r.resp_actif ?? true,
                      resp_cree_le: r.resp_cree_le ?? r.cree_le,
                  })
                : undefined,
    };
}

export const ProjetRepository = {

    // Lister avec filtres optionnels
    async findAll(filters?: {
        statut?: StatutProjet;
        responsable_id?: string;
        date_debut?: string;
        date_fin?: string;
    }): Promise<Projet[]> {
        const conditions: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (filters?.statut) {
            conditions.push(`p.statut = $${i++}`);
            values.push(filters.statut);
        }
        if (filters?.responsable_id) {
            conditions.push(`p.responsable_id = $${i++}`);
            values.push(filters.responsable_id);
        }
        if (filters?.date_debut) {
            conditions.push(`p.date_debut >= $${i++}`);
            values.push(filters.date_debut);
        }
        if (filters?.date_fin) {
            conditions.push(`p.date_fin_prevue <= $${i++}`);
            values.push(filters.date_fin);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const { rows } = await db.query(
            `SELECT p.*,
                    u.id AS resp_id, u.nom AS resp_nom, u.prenom AS resp_prenom,
                    u.email AS resp_email, u.role::text AS resp_role, u.actif AS resp_actif, u.cree_le AS resp_cree_le
             FROM projet p
             LEFT JOIN utilisateur u ON u.id = p.responsable_id
             ${where}
             ORDER BY p.cree_le DESC`,
            values
        );
        return rows.map((row) => mapProjetRow(row));
    },

    // Trouver par ID (sans suivis)
    async findById(id: string): Promise<Projet | null> {
        const { rows } = await db.query(
            `SELECT p.*,
                    u.id AS resp_id, u.nom AS resp_nom, u.prenom AS resp_prenom,
                    u.email AS resp_email, u.role::text AS resp_role, u.actif AS resp_actif, u.cree_le AS resp_cree_le
             FROM projet p
             LEFT JOIN utilisateur u ON u.id = p.responsable_id
             WHERE p.id = $1`,
            [id]
        );
        return rows[0] ? mapProjetRow(rows[0]) : null;
    },

    // Créer
    async create(dto: CreateProjetDTO, responsable_id: string): Promise<Projet> {
        const { rows } = await db.query<Projet>(
            `INSERT INTO projet
                (reference, nom, client, date_debut, date_fin_prevue, responsable_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [dto.reference, dto.nom, dto.client, dto.date_debut, dto.date_fin_prevue, responsable_id]
        );
        // Créer automatiquement un suivi_service pour chaque service
        await db.query(
            `INSERT INTO suivi_service (projet_id, service_id)
             SELECT $1, s.id FROM service s`,
            [rows[0].id]
        );
        return rows[0];
    },

    // Mettre à jour
    async update(id: string, dto: UpdateProjetDTO): Promise<Projet | null> {
        const fields: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (dto.nom)              { fields.push(`nom = $${i++}`);             values.push(dto.nom); }
        if (dto.client)           { fields.push(`client = $${i++}`);          values.push(dto.client); }
        if (dto.date_fin_prevue)  { fields.push(`date_fin_prevue = $${i++}`); values.push(dto.date_fin_prevue); }
        if (dto.responsable_id)   { fields.push(`responsable_id = $${i++}`);  values.push(dto.responsable_id); }
        if (dto.statut)           { fields.push(`statut = $${i++}`);          values.push(dto.statut); }

        if (!fields.length) return null;
        values.push(id);

        const { rows } = await db.query<Projet>(
            `UPDATE projet SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
            values
        );
        return rows[0] || null;
    },

    // Supprimer
    async delete(id: string): Promise<boolean> {
        const { rowCount } = await db.query(
            `DELETE FROM projet WHERE id = $1`,
            [id]
        );
        return (rowCount ?? 0) > 0;
    },

    // KPIs dashboard (compteurs projet + avancement moyen)
    async getKPIsBase() {
        const { rows } = await db.query(`
            SELECT
                COUNT(*)::INT                                         AS total_projets,
                COUNT(*) FILTER (WHERE statut = 'EN_COURS')::INT     AS projets_en_cours,
                COUNT(*) FILTER (WHERE statut = 'EN_RETARD')::INT    AS projets_en_retard,
                COUNT(*) FILTER (WHERE statut = 'TERMINE')::INT      AS projets_termines,
                COALESCE(ROUND(AVG(taux_avancement)), 0)::INT       AS taux_avancement_global
            FROM projet
        `);
        return rows[0] as {
            total_projets: number;
            projets_en_cours: number;
            projets_en_retard: number;
            projets_termines: number;
            taux_avancement_global: number;
        };
    },

    async getAvancementParService(): Promise<{ service: NomService; taux_moyen: number }[]> {
        const { rows } = await db.query(
            `SELECT s.nom::text AS service,
                    COALESCE(ROUND(AVG(ss.taux_avancement)), 0)::INT AS taux_moyen
             FROM service s
             LEFT JOIN suivi_service ss ON ss.service_id = s.id
             GROUP BY s.nom
             ORDER BY s.nom`
        );
        return rows.map((r) => ({
            service: r.service as NomService,
            taux_moyen: Number(r.taux_moyen),
        }));
    },
};
