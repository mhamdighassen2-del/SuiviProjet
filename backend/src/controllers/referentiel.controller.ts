import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { CAUSES_RETARD } from '../models/causes-retard';

const router = Router();

router.get('/referentiels/causes-retard', authenticate, (_req: Request, res: Response) => {
    res.json({ data: CAUSES_RETARD });
});

export default router;
