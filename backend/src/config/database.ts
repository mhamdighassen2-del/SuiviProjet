import { Pool, types } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// DATE → 'YYYY-MM-DD' (évite Date JS → JSON ISO UTC et décalage d’un jour côté navigateur)
types.setTypeParser(types.builtins.DATE, (val: string) => val);

export const db = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME     || 'suivi_projets',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
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
        console.error('Password set:', !!process.env.DB_PASSWORD);
    });

export default db;