import { Router, Request, Response } from 'express';
import { UtilisateurService } from '../services/utilisateur.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', async (_req: Request, res: Response) => {
    try {
        const data = await UtilisateurService.lister();
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const data = await UtilisateurService.creer(req.body);
        res.status(201).json({ data, message: 'Utilisateur créé' });
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

router.patch('/:id/desactiver', async (req: Request, res: Response) => {
    try {
        const data = await UtilisateurService.desactiver(req.params.id);
        res.json({ data, message: 'Utilisateur désactivé' });
    } catch (err) {
        const msg = (err as Error).message;
        if (msg === 'Utilisateur introuvable') return res.status(404).json({ message: msg });
        res.status(400).json({ message: msg });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const u = await UtilisateurService.getById(req.params.id);
        if (!u) return res.status(404).json({ message: 'Utilisateur introuvable' });
        res.json({ data: u });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const data = await UtilisateurService.modifier(req.params.id, req.body);
        res.json({ data, message: 'Utilisateur mis à jour' });
    } catch (err) {
        const msg = (err as Error).message;
        if (msg === 'Utilisateur introuvable') return res.status(404).json({ message: msg });
        res.status(400).json({ message: msg });
    }
});

export default router;
