import { Router, Request, Response } from 'express';
import { SuiviService } from '../services/suivi.service';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.put(
    '/:id',
    authenticate,
    authorize('RESPONSABLE_SERVICE', 'CHEF_PROJET', 'ADMIN'),
    async (req: Request, res: Response) => {
        try {
            const data = await SuiviService.mettreAJour(req.params.id, req.body);
            res.json({ data, message: 'Suivi mis à jour' });
        } catch (err) {
            const msg = (err as Error).message;
            if (msg === 'Suivi introuvable') return res.status(404).json({ message: msg });
            res.status(400).json({ message: msg });
        }
    }
);

export default router;
