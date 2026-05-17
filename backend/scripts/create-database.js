/**
 * Crée la base PostgreSQL DB_NAME si elle n'existe pas.
 * Connexion à la base système "postgres", puis CREATE DATABASE.
 * Usage : depuis backend/ → npm run db:create
 */
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function validDbName(name) {
    if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
        throw new Error(`Nom de base invalide : ${name}`);
    }
    return name;
}

async function main() {
    const dbName = validDbName(process.env.DB_NAME || 'suivi_projets');
    const admin = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: String(process.env.DB_PASSWORD ?? ''),
        database: 'postgres',
    });

    await admin.connect();
    try {
        const r = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
        if (r.rowCount === 0) {
            await admin.query(`CREATE DATABASE ${dbName}`);
            console.log(`OK — Base "${dbName}" créée.`);
            console.log('Étapes suivantes : npm run db:migrate puis npm run db:seed');
        } else {
            console.log(`La base "${dbName}" existe déjà.`);
        }
    } finally {
        await admin.end();
    }
}

main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
});
