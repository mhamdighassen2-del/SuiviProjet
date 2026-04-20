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
    service_id: string | null;
    service_nom: string | null;
};

export const AuthRepository = {
    async findWithPasswordByEmail(email: string): Promise<UtilisateurAvecHash | null> {
        const { rows } = await db.query<UtilisateurAvecHash>(
            `SELECT u.id, u.nom, u.prenom, u.email, u.role::text AS role, u.actif, u.mot_de_passe_hash, u.cree_le,
                    u.service_id, s.nom::text AS service_nom
             FROM utilisateur u
             LEFT JOIN service s ON s.id = u.service_id
             WHERE LOWER(TRIM(u.email)) = LOWER(TRIM($1))`,
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
        service_id: string | null;
        service_nom: string | null;
    } | null> {
        const { rows } = await db.query(
            `SELECT u.id, u.nom, u.prenom, u.email, u.role::text AS role, u.actif, u.cree_le,
                    u.service_id, s.nom::text AS service_nom
             FROM utilisateur u
             LEFT JOIN service s ON s.id = u.service_id
             WHERE u.id = $1`,
            [id]
        );
        return rows[0] as {
            id: string;
            nom: string;
            prenom: string;
            email: string;
            role: RoleUtilisateur;
            actif: boolean;
            cree_le: Date;
            service_id: string | null;
            service_nom: string | null;
        } | null;
    },
};
