/**
 * Contrôle de toutes les pages, à toutes les largeurs cibles.
 * Vérifie : absence d'erreur JS, absence de ressource manquante,
 * absence de défilement horizontal, présence d'un titre de niveau 1.
 */
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const BASE = process.env.BASE_PATH ?? '';
const PAGES = ['/', '/offres/', '/studio/', '/osteopathie/', '/a-propos/', '/contact/',
  '/reserver/', '/connexion/', '/mentions-legales/', '/cgv/', '/confidentialite/', '/introuvable/'];
const WIDTHS = [375, 430, 768, 1280, 1920];
const HEIGHTS = { 375: 812, 430: 932, 768: 1024, 1280: 800, 1920: 1080 };

const server = await serve(4321);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
let failures = 0;

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: HEIGHTS[width] }, locale: 'fr-FR' });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`JS ${e.message}`));
  page.on('response', (r) => {
    // Les préchargements RSC (.txt) n'existent pas en export statique : sans objet.
    // Les préchargements RSC (.txt) et la page de test 404 sont attendus.
    if (r.status() >= 400 && !r.url().includes('index.txt') && !r.url().includes('/introuvable/')) {
      problems.push(`${r.status()} ${r.url()}`);
    }
  });

  const line = [];
  for (const path of PAGES) {
    problems.length = 0;
    await page.goto(`http://localhost:4321${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 260) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 30));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      // Laisse les transitions de révélation se terminer avant la mesure.
      await new Promise((r) => setTimeout(r, 1100));
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const h1 = await page.locator('h1').count();
    const invisible = await page.evaluate(() =>
      [...document.querySelectorAll('article, li, h2')].filter((el) => getComputedStyle(el).opacity === '0').length);

    const issues = [];
    if (overflow > 0) issues.push(`débordement ${overflow}px`);
    if (h1 === 0) issues.push('aucun h1');
    if (invisible > 0) issues.push(`${invisible} éléments invisibles`);
    if (problems.length) issues.push(...problems.slice(0, 2));

    if (issues.length) { failures += 1; line.push(`\n    ✗ ${path} → ${issues.join(' ; ')}`); }
    else line.push(`\n    ✓ ${path}`);
  }
  console.log(`\n  ${width}px${line.join('')}`);
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures === 0 ? '\nToutes les pages sont conformes.' : `\n${failures} problème(s).`);
process.exit(failures === 0 ? 0 : 1);
