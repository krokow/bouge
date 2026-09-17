/** Parcours de l'espace gérant sur le site exporté. */
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const width = Number(process.argv[2] ?? 1440);
const heights = { 390: 844, 768: 1024, 1440: 900 };
const PORT = Number(process.env.TEST_PORT ?? 4332);
const server = await serve(PORT);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width, height: heights[width] ?? 900 }, locale: 'fr-FR' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`JS: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(`CONSOLE: ${m.text()}`));

await page.goto(`http://localhost:${PORT}/connexion/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
const refuse = page.getByRole('button', { name: 'Tout refuser' });
if (await refuse.isVisible().catch(() => false)) await refuse.click();

console.log(`Espace gérant @${width}px`);
await page.locator('#login-email').fill('melvin@bouge-studio.fr');
await page.locator('#login-password').fill('bouge2026');
await page.locator('form').getByRole('button', { name: 'Se connecter' }).click();
await page.waitForURL('**/admin/**', { timeout: 8000 });
await page.waitForTimeout(900);
console.log('  ✓ Connexion gérant et redirection vers /admin/');

const sections = width < 1280
  ? ['Accueil', 'Agenda', 'RDV', 'Blocages', 'Coachs', 'Équipe', 'Stats', 'Emails']
  : ['Vue d’ensemble', 'Calendrier', 'Réservations', 'Indisponibilités', 'Qui assure quoi', 'L’équipe', 'Statistiques', 'Emails envoyés'];

for (const name of sections) {
  await page.getByRole('button', { name, exact: true }).click();
  await page.waitForTimeout(650);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const heading = await page.locator('h1').first().textContent();
  console.log(`  ✓ ${name.padEnd(18)} → « ${heading.trim()} »  débordement: ${overflow}px`);
  await page.screenshot({ path: `/tmp/shots/admin_${name.replace(/\W+/g, '')}_${width}.png`, fullPage: true });
}

// Création puis suppression d'un blocage
await page.getByRole('button', { name: sections[3], exact: true }).click();
await page.waitForTimeout(400);
const before = await page.locator('button:has-text("Lever")').count();
await page.getByRole('button', { name: 'Une journée', exact: true }).click();
await page.locator('#block-reason').fill('Test automatisé');
await page.getByRole('button', { name: 'Bloquer', exact: true }).click();
await page.waitForTimeout(500);
const after = await page.locator('button:has-text("Lever")').count();
console.log(`  ${after > before ? '✓' : '✗'} Création d’un blocage (${before} → ${after})`);

if (errors.length) console.log('ERREURS:\n' + errors.join('\n'));
else console.log('Aucune erreur JavaScript.');
await browser.close();
server.close();
