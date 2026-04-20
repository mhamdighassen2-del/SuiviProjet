/**
 * Exécute un fichier .sql sur la base DB_NAME (migrations / seeds).
 * Usage : node scripts/run-sql-file.js ../database/migrations/001_init.sql
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
    const rel = process.argv[2];
    if (!rel) {
        console.error('Usage: node scripts/run-sql-file.js <chemin-fichier.sql>');
        process.exit(1);
    }
    const sqlPath = path.isAbsolute(rel) ? rel : path.join(__dirname, '..', rel);
    if (!fs.existsSync(sqlPath)) {
        console.error('Fichier introuvable :', sqlPath);
        process.exit(1);
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'suivi_projets',
    });

    await client.connect();
    try {
        await client.query(sql);
        console.log('OK —', sqlPath);
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
});
