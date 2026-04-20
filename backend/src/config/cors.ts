import { CorsOptions } from 'cors';

/** Origines autorisées : localhost et 127.0.0.1 ne sont pas la même origine pour le navigateur. */
export function getCorsOptions(): CorsOptions {
    const fromEnv = process.env.FRONTEND_URL;
    const devDefaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
    const list = [...(fromEnv ? [fromEnv] : []), ...devDefaults];
    const unique = [...new Set(list)];
    return {
        origin: unique,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    };
}
