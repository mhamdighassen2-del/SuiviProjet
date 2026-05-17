import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { RepereService } from '../services/repere.service';
import { HttpError } from '../utils/http-error';

const router = Router();

function handleError(err: unknown, res: Response) {
    if (err instanceof HttpError) return res.status(err.statusCode).json({ message: err.message });
    res.status(500).json({ message: (err as Error).message });
}

// GET /api/projets/:projetId/reperes
router.get('/projets/:projetId/reperes', authenticate, async (req: Request, res: Response) => {
    try {
        const data = await RepereService.listerParProjet(req.params.projetId);
        res.json({ data });
    } catch (err) { handleError(err, res); }
});

// GET /api/projets/:projetId/reperes/stats
router.get('/projets/:projetId/reperes/stats', authenticate, async (req: Request, res: Response) => {
    try {
        const data = await RepereService.getStats(req.params.projetId);
        res.json({ data });
    } catch (err) { handleError(err, res); }
});

// POST /api/projets/:projetId/reperes
router.post(
    '/projets/:projetId/reperes',
    authenticate,
    authorize('CHEF_PROJET', 'ADMIN'),
    async (req: Request, res: Response) => {
        try {
            const data = await RepereService.creer(req.params.projetId, req.body);
            res.status(201).json({ data, message: 'Repère créé' });
        } catch (err) { handleError(err, res); }
    }
);

// PUT /api/reperes/:id
router.put(
    '/reperes/:id',
    authenticate,
    authorize('CHEF_PROJET', 'ADMIN', 'RESPONSABLE_SERVICE'),
    async (req: Request, res: Response) => {
        try {
            const data = await RepereService.modifier(req.params.id, req.body);
            res.json({ data, message: 'Repère mis à jour' });
        } catch (err) { handleError(err, res); }
    }
);

// DELETE /api/reperes/:id
router.delete(
    '/reperes/:id',
    authenticate,
    authorize('CHEF_PROJET', 'ADMIN'),
    async (req: Request, res: Response) => {
        try {
            await RepereService.supprimer(req.params.id);
            res.json({ message: 'Repère supprimé' });
        } catch (err) { handleError(err, res); }
    }
);

export default router;
