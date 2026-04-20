import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { getCorsOptions } from './config/cors';
import './config/database';
import authRouter from './controllers/auth.controller';
import projetRouter from './controllers/projet.controller';
import dashboardRouter from './controllers/dashboard.controller';
import suiviRouter from './controllers/suivi.controller';
import ofRouter from './controllers/of.controller';
import rapportRouter from './controllers/rapport.controller';
import utilisateurRouter from './controllers/utilisateur.controller';
import serviceRouter from './controllers/service.controller';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
    res.type('text/plain; charset=utf-8').send(
        'API suivi-projets — pas d’interface ici. Lancez le frontend (npm run dev dans /frontend) puis ouvrez http://localhost:5173\n' +
        'Santé: GET /health'
    );
});

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api', serviceRouter);
app.use('/api/utilisateurs', utilisateurRouter);
app.use('/api/projets', projetRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/suivis', suiviRouter);
app.use('/api', ofRouter);
app.use('/api', rapportRouter);

app.use((
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});

export default app;