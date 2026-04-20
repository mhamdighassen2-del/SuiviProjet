import db from '../config/database';
import { CreateUtilisateurDTO, RoleUtilisateur, UpdateUtilisateurDTO } from '../models/types';

export type UtilisateurRow = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    actif: boolean;
    cree_le: Date;
    service_id: string | null;
    service_nom?: string | null;
};

export const UtilisateurRepository = {
    async findAll(): Promise<UtilisateurRow[]> {
        const { rows } = await db.query<UtilisateurRow>(
            `SELECT u.id, u.nom, u.prenom, u.email, u.role::text AS role, u.actif, u.cree_le, u.service_id,
                    s.nom::text AS service_nom
             FROM utilisateur u
             LEFT JOIN service s ON s.id = u.service_id
             ORDER BY u.nom, u.prenom`
        );
        return rows;
    },

    async findById(id: string): Promise<UtilisateurRow | null> {
        const { rows } = await db.query<UtilisateurRow>(
            `SELECT u.id, u.nom, u.prenom, u.email, u.role::text AS role, u.actif, u.cree_le, u.service_id,
                    s.nom::text AS service_nom
             FROM utilisateur u
             LEFT JOIN service s ON s.id = u.service_id
             WHERE u.id = $1`,
            [id]
        );
        return rows[0] || null;
    },

    async findAccessById(id: string): Promise<{ role: RoleUtilisateur; service_id: string | null } | null> {
        const { rows } = await db.query<{ role: string; service_id: string | null }>(
            `SELECT role::text AS role, service_id FROM utilisateur WHERE id = $1`,
            [id]
        );
        const r = rows[0];
        if (!r) return null;
        return { role: r.role as RoleUtilisateur, service_id: r.service_id };
    },

    async findByEmail(email: string): Promise<UtilisateurRow | null> {
        const { rows } = await db.query<UtilisateurRow>(
            `SELECT id, nom, prenom, email, role::text AS role, actif, cree_le
             FROM utilisateur WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
            [email]
        );
        return rows[0] || null;
    },

    async create(dto: CreateUtilisateurDTO, mot_de_passe_hash: string): Promise<UtilisateurRow> {
        const { rows } = await db.query<UtilisateurRow>(
            `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe_hash, role, service_id)
             VALUES ($1, $2, $3, $4, $5::role_utilisateur, $6)
             RETURNING id, nom, prenom, email, role::text AS role, actif, cree_le, service_id`,
            [dto.nom, dto.prenom, dto.email.trim(), mot_de_passe_hash, dto.role, dto.service_id ?? null]
        );
        const created = rows[0];
        return (await UtilisateurRepository.findById(created.id)) ?? created;
    },

    async update(id: string, dto: UpdateUtilisateurDTO, mot_de_passe_hash?: string | null): Promise<UtilisateurRow | null> {
        const fields: string[] = [];
        const values: unknown[] = [];
        let i = 1;

        if (dto.nom !== undefined) {
            fields.push(`nom = $${i++}`);
            values.push(dto.nom);
        }
        if (dto.prenom !== undefined) {
            fields.push(`prenom = $${i++}`);
            values.push(dto.prenom);
        }
        if (dto.email !== undefined) {
            fields.push(`email = $${i++}`);
            values.push(dto.email.trim());
        }
        if (mot_de_passe_hash !== undefined && mot_de_passe_hash !== null) {
            fields.push(`mot_de_passe_hash = $${i++}`);
            values.push(mot_de_passe_hash);
        }
        if (dto.role !== undefined) {
            fields.push(`role = $${i++}::role_utilisateur`);
            values.push(dto.role);
        }
        if (dto.actif !== undefined) {
            fields.push(`actif = $${i++}`);
            values.push(dto.actif);
        }
        if (dto.service_id !== undefined) {
            fields.push(`service_id = $${i++}`);
            values.push(dto.service_id);
        }

        if (!fields.length) return UtilisateurRepository.findById(id);

        values.push(id);
        const { rows } = await db.query<UtilisateurRow>(
            `UPDATE utilisateur SET ${fields.join(', ')} WHERE id = $${i}
             RETURNING id`,
            values
        );
        return rows[0] ? UtilisateurRepository.findById(id) : null;
    },

    async deleteHard(id: string): Promise<boolean> {
        const { rowCount } = await db.query(`DELETE FROM utilisateur WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    },

    async countProjetsResponsable(id: string): Promise<number> {
        const { rows } = await db.query<{ c: string }>(
            `SELECT COUNT(*)::int AS c FROM projet WHERE responsable_id = $1`,
            [id]
        );
        return Number(rows[0]?.c ?? 0);
    },

    async countAdmins(): Promise<number> {
        const { rows } = await db.query<{ c: string }>(
            `SELECT COUNT(*)::int AS c FROM utilisateur WHERE role = 'ADMIN'::role_utilisateur`
        );
        return Number(rows[0]?.c ?? 0);
    },

    /** Libère les FK optionnelles puis supprime l’utilisateur (projet.responsable_id doit être vide côté métier). */
    async deleteCascade(id: string): Promise<boolean> {
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            await client.query(`UPDATE suivi_service SET responsable_id = NULL WHERE responsable_id = $1`, [id]);
            await client.query(`UPDATE document SET uploade_par = NULL WHERE uploade_par = $1`, [id]);
            await client.query(`UPDATE historique SET utilisateur_id = NULL WHERE utilisateur_id = $1`, [id]);
            const { rowCount } = await client.query(`DELETE FROM utilisateur WHERE id = $1`, [id]);
            await client.query('COMMIT');
            return (rowCount ?? 0) > 0;
        } catch (e) {
            try {
                await client.query('ROLLBACK');
            } catch {
                /* */
            }
            throw e;
        } finally {
            client.release();
        }
    },
};
