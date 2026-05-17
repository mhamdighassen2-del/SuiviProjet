import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { RapportService } from '../services/rapport.service';
import { HttpError } from '../utils/http-error';

const router = Router();

router.get('/rapports/projet/:id/pdf', authenticate, async (req: Request, res: Response) => {
    try {
        const buf = await RapportService.exportProjetPdf(req.params.id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="projet-${req.params.id}.pdf"`);
        res.send(buf);
    } catch (err) {
        const msg = (err as Error).message;
        if (msg === 'Projet introuvable') return res.status(404).json({ message: msg });
        if (err instanceof HttpError) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: msg });
    }
});

router.get('/rapports/projet/:id/excel', authenticate, async (req: Request, res: Response) => {
    try {
        const buf = await RapportService.exportProjetExcel(req.params.id);
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', `attachment; filename="projet-${req.params.id}.xlsx"`);
        res.send(buf);
    } catch (err) {
        const msg = (err as Error).message;
        if (msg === 'Projet introuvable') return res.status(404).json({ message: msg });
        if (err instanceof HttpError) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: msg });
    }
});

router.get('/rapports/ofs/excel', authenticate, async (_req: Request, res: Response) => {
    try {
        const buf = await RapportService.exportOFsExcel();
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader('Content-Disposition', 'attachment; filename="ofs.xlsx"');
        res.send(buf);
    } catch (err) {
        const msg = (err as Error).message;
        if (err instanceof HttpError) return res.status(err.statusCode).json({ message: err.message });
        res.status(500).json({ message: msg });
    }
});

export default router;
