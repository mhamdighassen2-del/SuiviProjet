/**
 * Vérifie que DB_HOST / DB_PORT / DB_USER / DB_PASSWORD dans .env permettent de se connecter.
 * Usage : depuis backend/ → npm run db:verify
 */
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 5432;
    const user = process.env.DB_USER || 'postgres';
    const password = String(process.env.DB_PASSWORD ?? '');
    const database = 'postgres';

    console.log(`Test connexion : ${user}@${host}:${port} (base "${database}")…`);
    if (password === '') {
        console.warn('(DB_PASSWORD est vide — à remplir si PostgreSQL exige un mot de passe.)');
    }
    const client = new Client({ host, port, user, password, database });
    await client.connect();
    try {
        const r = await client.query('SELECT current_user, current_database()');
        console.log('OK — PostgreSQL accepte ces identifiants.');
        console.log('   ', r.rows[0]);
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error('ÉCHEC —', e.message || e);
    console.error('');
    console.error('Corrigez DB_USER et DB_PASSWORD dans backend/.env :');
    console.error('  • Mot de passe défini lors de l’installation de PostgreSQL (Windows).');
    console.error('  • Ou ouvrez pgAdmin → connexion au serveur → propriétés du rôle postgres.');
    process.exit(1);
});
