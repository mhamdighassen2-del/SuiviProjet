import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, mot_de_passe } = req.body as { email?: string; mot_de_passe?: string };
        if (!email?.trim() || !mot_de_passe) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }
        const { token, user } = await AuthService.login(email, mot_de_passe);
        res.json({ token, user });
    } catch (err) {
        const e = err as Error & { code?: string };
        const msg = e.message || '';
        if (msg === 'Compte désactivé') {
            return res.status(403).json({ message: msg });
        }
        if (msg === 'Identifiants incorrects') {
            return res.status(401).json({ message: msg });
        }
        if (msg.includes('JWT') || msg.includes('Configuration serveur')) {
            return res.status(500).json({ message: msg });
        }
        if (
            e.code === 'ECONNREFUSED' ||
            e.code === 'ETIMEDOUT' ||
            msg.includes('Connection terminated') ||
            msg.includes('timeout')
        ) {
            return res.status(503).json({
                message:
                    'Base de données indisponible. Démarrez PostgreSQL et vérifiez DB_HOST, DB_PORT, DB_NAME, DB_USER et DB_PASSWORD dans backend/.env.',
            });
        }
        if (msg.includes('password authentication failed') || msg.includes('authentification par mot de passe')) {
            return res.status(503).json({
                message:
                    'PostgreSQL refuse la connexion : utilisateur ou mot de passe incorrect (voir DB_USER / DB_PASSWORD dans backend/.env).',
            });
        }
        res.status(500).json({ message: msg || 'Erreur serveur' });
    }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const user = await AuthService.getProfilUtilisateur(req.user!.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        res.json({ data: user });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

export default router;
