import { Router, Request, Response } from 'express';
import { ServiceRepository } from '../repositories/service.repository';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/services', authenticate, async (_req: Request, res: Response) => {
    try {
        const data = await ServiceRepository.findAll();
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

export default router;
