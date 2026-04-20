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
};

export const UtilisateurRepository = {
    async findAll(): Promise<UtilisateurRow[]> {
        const { rows } = await db.query<UtilisateurRow>(
            `SELECT id, nom, prenom, email, role::text AS role, actif, cree_le
             FROM utilisateur ORDER BY nom, prenom`
        );
        return rows;
    },

    async findById(id: string): Promise<UtilisateurRow | null> {
        const { rows } = await db.query<UtilisateurRow>(
            `SELECT id, nom, prenom, email, role::text AS role, actif, cree_le FROM utilisateur WHERE id = $1`,
            [id]
        );
        return rows[0] || null;
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
            `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe_hash, role)
             VALUES ($1, $2, $3, $4, $5::role_utilisateur)
             RETURNING id, nom, prenom, email, role::text AS role, actif, cree_le`,
            [dto.nom, dto.prenom, dto.email.trim(), mot_de_passe_hash, dto.role]
        );
        return rows[0];
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

        if (!fields.length) return UtilisateurRepository.findById(id);

        values.push(id);
        const { rows } = await db.query<UtilisateurRow>(
            `UPDATE utilisateur SET ${fields.join(', ')} WHERE id = $${i}
             RETURNING id, nom, prenom, email, role::text AS role, actif, cree_le`,
            values
        );
        return rows[0] || null;
    },

    async deleteHard(id: string): Promise<boolean> {
        const { rowCount } = await db.query(`DELETE FROM utilisateur WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    },
};
