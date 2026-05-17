import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RoleUtilisateur } from '../models/types';

// Étend le type Request pour y ajouter l'utilisateur courant
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: RoleUtilisateur;
                service_id?: string | null;
            };
        }
    }
}

// ── Authentification ─────────────────────────────────────────
export function authenticate(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
    }

    const token = header.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: string;
            email: string;
            role: RoleUtilisateur;
            service_id?: string | null;
        };
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
}

// ── Autorisation par rôle ────────────────────────────────────
const ROLE_HIERARCHY: Record<RoleUtilisateur, number> = {
    UTILISATEUR:          1,
    RESPONSABLE_SERVICE:  2,
    CHEF_PROJET:          3,
    ADMIN:                4,
};

export function authorize(...roles: RoleUtilisateur[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Non authentifié' });
        }
        const userLevel   = ROLE_HIERARCHY[req.user.role];
        const minRequired = Math.min(...roles.map(r => ROLE_HIERARCHY[r]));

        if (userLevel < minRequired) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
        next();
    };
}

// Usage dans les routes :
// router.post('/projets', authenticate, authorize('CHEF_PROJET', 'ADMIN'), createProjet);
