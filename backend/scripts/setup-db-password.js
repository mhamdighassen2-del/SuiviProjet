/**
 * Enregistre DB_PASSWORD dans backend/.env (pour éviter les erreurs de frappe).
 * Usage : cd backend && node scripts/setup-db-password.js
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '../.env');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function question(q) {
    return new Promise((resolve) => rl.question(q, resolve));
}

async function main() {
    console.log('Mot de passe PostgreSQL pour l’utilisateur défini dans DB_USER (souvent « postgres »).');
    console.log('(Le texte ne s’affiche pas — c’est normal sous Windows pour la sécurité.)\n');
    const pwd = await question('Mot de passe : ');
    rl.close();
    if (!fs.existsSync(envPath)) {
        console.error('Fichier introuvable :', envPath);
        process.exit(1);
    }
    let text = fs.readFileSync(envPath, 'utf8');
    if (/^DB_PASSWORD=/m.test(text)) {
        text = text.replace(/^DB_PASSWORD=.*$/m, `DB_PASSWORD=${escapeEnvValue(pwd)}`);
    } else {
        text += `\nDB_PASSWORD=${escapeEnvValue(pwd)}\n`;
    }
    fs.writeFileSync(envPath, text, 'utf8');
    console.log('\nOK — backend/.env mis à jour. Lancez : npm run db:verify');
}

function escapeEnvValue(s) {
    if (/[\s#"']/.test(s)) {
        return `"${s.replace(/"/g, '\\"')}"`;
    }
    return s;
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
