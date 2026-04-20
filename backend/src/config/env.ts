import dotenv from 'dotenv';
import path from 'path';

/** Charge toujours `backend/.env`, quel que soit le répertoire courant. */
const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn('⚠️ Fichier .env introuvable à :', envPath);
} else if (process.env.NODE_ENV !== 'production') {
    const pwd = process.env.DB_PASSWORD ?? '';
    if (!pwd || pwd.includes('REMPLACEZ')) {
        console.warn(
            '⚠️ Dans backend/.env, définissez DB_PASSWORD avec le mot de passe PostgreSQL réel (ligne sans espace avant/après le =).'
        );
    }
}
