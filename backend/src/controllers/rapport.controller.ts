import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/rapports/projet/:id/pdf', authenticate, (_req: Request, res: Response) => {
    res.status(501).json({ message: 'Export PDF non encore implémenté (pdfkit côté serveur).' });
});

router.get('/rapports/projet/:id/excel', authenticate, (_req: Request, res: Response) => {
    res.status(501).json({ message: 'Export Excel projet non encore implémenté.' });
});

router.get('/rapports/ofs/excel', authenticate, (_req: Request, res: Response) => {
    res.status(501).json({ message: 'Export Excel des OF non encore implémenté.' });
});

export default router;
