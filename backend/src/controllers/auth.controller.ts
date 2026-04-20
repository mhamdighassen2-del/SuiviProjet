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
        const msg = (err as Error).message;
        if (msg === 'Compte désactivé') {
            return res.status(403).json({ message: msg });
        }
        if (msg === 'Identifiants incorrects') {
            return res.status(401).json({ message: msg });
        }
        if (msg.includes('JWT')) {
            return res.status(500).json({ message: msg });
        }
        res.status(401).json({ message: msg });
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
