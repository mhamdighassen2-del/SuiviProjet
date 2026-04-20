import { Router, Request, Response } from 'express';
import { ProjetService } from '../services/projet.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/projets?statut=EN_COURS&date_debut=2024-01-01
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { statut, date_debut, date_fin } = req.query as Record<string, string>;
        const projets = await ProjetService.listerProjets({ statut: statut as any, date_debut, date_fin });
        res.json({ data: projets });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

// GET /api/projets/:id/suivis — avant /:id
router.get('/:id/suivis', authenticate, async (req: Request, res: Response) => {
    try {
        const data = await ProjetService.listerSuivisProjet(req.params.id);
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.get('/:id/historique', authenticate, async (_req: Request, res: Response) => {
    res.json({ data: [] });
});

// GET /api/projets/:id
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const projet = await ProjetService.getProjet(req.params.id);
        res.json({ data: projet });
    } catch (err) {
        res.status(404).json({ message: (err as Error).message });
    }
});

// POST /api/projets
router.post('/', authenticate, authorize('CHEF_PROJET', 'ADMIN'), async (req: Request, res: Response) => {
    try {
        const projet = await ProjetService.creerProjet(req.body, req.user!.id);
        res.status(201).json({ data: projet, message: 'Projet créé' });
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

// PUT /api/projets/:id
router.put('/:id', authenticate, authorize('CHEF_PROJET', 'ADMIN'), async (req: Request, res: Response) => {
    try {
        const projet = await ProjetService.modifierProjet(req.params.id, req.body);
        res.json({ data: projet, message: 'Projet mis à jour' });
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

// DELETE /api/projets/:id
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
    try {
        await ProjetService.supprimerProjet(req.params.id);
        res.json({ message: 'Projet supprimé' });
    } catch (err) {
        res.status(404).json({ message: (err as Error).message });
    }
});

export default router;
