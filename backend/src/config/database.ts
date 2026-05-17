import { Pool, types } from 'pg';
import './env';

// DATE → 'YYYY-MM-DD' (évite Date JS → JSON ISO UTC et décalage d’un jour côté navigateur)
types.setTypeParser(types.builtins.DATE, (val: string) => val);

/** Mot de passe toujours une chaîne (évite l’erreur SCRAM « client password must be a string » si .env est mal parsé). */
function dbPassword(): string {
    const p = process.env.DB_PASSWORD;
    if (p === undefined || p === null) return '';
    return String(p).trim();
}

function dbUser(): string {
    return String(process.env.DB_USER ?? 'postgres').trim();
}

export const db = new Pool({
    host:     (process.env.DB_HOST || 'localhost').trim(),
    port:     Number(process.env.DB_PORT) || 5432,
    database: (process.env.DB_NAME || 'suivi_projets').trim(),
    user:     dbUser(),
    password: dbPassword(),
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

db.connect()
    .then(client => {
        console.log('✅ PostgreSQL connecté');
        client.release();
    })
    .catch(err => {
        console.error('❌ Erreur connexion PostgreSQL :', err.message);
        console.error('Host:', process.env.DB_HOST);
        console.error('Port:', process.env.DB_PORT);
        console.error('DB:', process.env.DB_NAME);
        console.error('User:', process.env.DB_USER);
        console.error('Password length:', dbPassword().length);
    });

export default db;