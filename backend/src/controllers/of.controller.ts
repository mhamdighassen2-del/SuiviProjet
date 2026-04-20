import { Router, Request, Response } from 'express';
import { OFService } from '../services/of.service';
import { CreateOFDTO } from '../models/types';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/ofs/en-retard', authenticate, async (_req: Request, res: Response) => {
    try {
        const data = await OFService.listerEnRetard();
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.get('/ofs', authenticate, async (_req: Request, res: Response) => {
    try {
        const data = await OFService.listerTous();
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.get('/ofs/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const of = await OFService.getById(req.params.id);
        if (!of) return res.status(404).json({ message: 'OF introuvable' });
        res.json({ data: of });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.put(
    '/ofs/:id',
    authenticate,
    authorize('RESPONSABLE_SERVICE', 'CHEF_PROJET', 'ADMIN'),
    async (req: Request, res: Response) => {
        try {
            const data = await OFService.mettreAJour(req.params.id, req.body);
            if (!data) return res.status(404).json({ message: 'OF introuvable' });
            res.json({ data, message: 'OF mis à jour' });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    }
);

router.delete(
    '/ofs/:id',
    authenticate,
    authorize('CHEF_PROJET', 'ADMIN'),
    async (req: Request, res: Response) => {
        try {
            const ok = await OFService.supprimer(req.params.id);
            if (!ok) return res.status(404).json({ message: 'OF introuvable' });
            res.json({ message: 'OF supprimé' });
        } catch (err) {
            res.status(500).json({ message: (err as Error).message });
        }
    }
);

router.get('/suivis/:suiviId/ofs', authenticate, async (req: Request, res: Response) => {
    try {
        const data = await OFService.listerParSuivi(req.params.suiviId);
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.post(
    '/suivis/:suiviId/ofs',
    authenticate,
    authorize('RESPONSABLE_SERVICE', 'CHEF_PROJET', 'ADMIN'),
    async (req: Request, res: Response) => {
        try {
            const body = req.body as { projet_id?: string } & CreateOFDTO;
            const { projet_id, numero_of, designation, date_lancement, date_fin_prevue, commentaire } = body;
            if (!projet_id) {
                return res.status(400).json({ message: 'projet_id requis' });
            }
            const dto: CreateOFDTO = { numero_of, designation, date_lancement, date_fin_prevue, commentaire };
            const data = await OFService.creer(req.params.suiviId, projet_id, dto);
            res.status(201).json({ data, message: 'OF créé' });
        } catch (err) {
            res.status(400).json({ message: (err as Error).message });
        }
    }
);

export default router;
