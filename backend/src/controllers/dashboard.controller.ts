import { Router, Response } from 'express';
import { Request } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/kpis', authenticate, async (_req: Request, res: Response) => {
    try {
        const data = await DashboardService.getKPIs();
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

router.get('/avancement-par-service', authenticate, async (_req: Request, res: Response) => {
    try {
        const data = await DashboardService.getAvancementParService();
        res.json({ data });
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

export default router;
