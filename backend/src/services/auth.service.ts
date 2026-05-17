import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth.repository';

export const AuthService = {
    async login(email: string, mot_de_passe: string) {
        const row = await AuthRepository.findWithPasswordByEmail(email.trim());
        if (!row) {
            throw new Error('Identifiants incorrects');
        }
        if (!row.actif) {
            throw new Error('Compte désactivé');
        }
        const ok = await bcrypt.compare(mot_de_passe, row.mot_de_passe_hash);
        if (!ok) {
            throw new Error('Identifiants incorrects');
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('Configuration serveur incomplète (JWT)');
        }

        const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
        const token = jwt.sign(
            {
                id: row.id,
                email: row.email,
                role: row.role,
                service_id: row.service_id,
            },
            secret,
            { expiresIn } as jwt.SignOptions
        );

        const user = {
            id: row.id,
            nom: row.nom,
            prenom: row.prenom,
            email: row.email,
            role: row.role,
            actif: row.actif,
            cree_le: row.cree_le.toISOString(),
            service_id: row.service_id,
            service_nom: row.service_nom,
        };

        return { token, user };
    },

    async getProfilUtilisateur(id: string) {
        const row = await AuthRepository.findPublicById(id);
        if (!row) return null;
        return {
            id: row.id,
            nom: row.nom,
            prenom: row.prenom,
            email: row.email,
            role: row.role,
            actif: row.actif,
            cree_le: row.cree_le.toISOString(),
            service_id: row.service_id,
            service_nom: row.service_nom,
        };
    },
};
