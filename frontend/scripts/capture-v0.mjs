/**
 * Génère des captures d'écran pour la version 0 (base vide, un seul admin).
 * Prérequis : backend (3000) + frontend démarrés ; base préparée avec npm run db:v0.
 *
 * Usage : cd frontend && npm run capture:v0
 * Option : BASE_URL=http://localhost:5174 npm run capture:v0
 * Dossier : CAP_OUT=cap-v0 (défaut) → docs/captures/cap-v0
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');
const capFolder = process.env.CAP_OUT || 'cap-v0';
const outDir = join(repoRoot, 'docs', 'captures', capFolder);
const baseURL = process.env.BASE_URL || 'http://localhost:5173';

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: join(outDir, '01-login.png'), fullPage: true });

    await page.locator('#login-email').fill('admin@company.com');
    await page.locator('#login-password').fill('password123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.screenshot({ path: join(outDir, '02-dashboard.png'), fullPage: true });

    await page.goto(`${baseURL}/projets`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: join(outDir, '03-projets.png'), fullPage: true });

    await page.goto(`${baseURL}/rapports`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: join(outDir, '04-rapports.png'), fullPage: true });

    await page.goto(`${baseURL}/utilisateurs`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: join(outDir, '05-utilisateurs.png'), fullPage: true });

    console.log('Captures enregistrées dans', outDir);
} finally {
    await browser.close();
}
