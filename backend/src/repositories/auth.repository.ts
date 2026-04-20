import db from '../config/database';
import { RoleUtilisateur } from '../models/types';

export type UtilisateurAvecHash = {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    actif: boolean;
    mot_de_passe_hash: string;
    cree_le: Date;
};

export const AuthRepository = {
    async findWithPasswordByEmail(email: string): Promise<UtilisateurAvecHash | null> {
        const { rows } = await db.query<UtilisateurAvecHash>(
            `SELECT id, nom, prenom, email, role::text AS role, actif, mot_de_passe_hash, cree_le
             FROM utilisateur WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
            [email]
        );
        return rows[0] || null;
    },

    async findPublicById(id: string): Promise<{
        id: string;
        nom: string;
        prenom: string;
        email: string;
        role: RoleUtilisateur;
        actif: boolean;
        cree_le: Date;
    } | null> {
        const { rows } = await db.query(
            `SELECT id, nom, prenom, email, role::text AS role, actif, cree_le
             FROM utilisateur WHERE id = $1`,
            [id]
        );
        return rows[0] || null;
    },
};
