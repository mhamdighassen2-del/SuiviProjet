import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/** Dossier `backend/` (contient `.env`), que l’on parte de `src/config` ou `dist/config`. */
const backendDir = path.resolve(__dirname, '../..');
/** Racine du dépôt Git (parent de `backend/`). */
const repoRoot = path.resolve(__dirname, '../../..');

/**
 * Charge les variables dans cet ordre (les fichiers suivants écrasent les précédents) :
 * 1) `.env` à la racine du dépôt
 * 2) `backend/.env`
 */
const envPaths = [path.join(repoRoot, '.env'), path.join(backendDir, '.env')];

let loaded = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath, override: loaded });
        if (result.error) {
            console.warn('⚠️ Lecture .env impossible :', envPath, result.error.message);
        } else {
            loaded = true;
        }
    }
}

if (!loaded) {
    console.warn(
        '⚠️ Aucun fichier .env trouvé à la racine du projet ni dans backend/. — copiez backend/.env.example vers backend/.env (ou créez un .env à la racine).'
    );
} else if (process.env.NODE_ENV !== 'production') {
    const pwd = process.env.DB_PASSWORD ?? '';
    if (!pwd || pwd.includes('REMPLACEZ')) {
        console.warn(
            '⚠️ Dans backend/.env, définissez DB_PASSWORD avec le mot de passe PostgreSQL réel (ligne sans espace avant/après le =).'
        );
    }
}
