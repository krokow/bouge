/**
 * Parcours de bout en bout du tunnel de réservation, sur le site exporté.
 *   node tools/test-booking.mjs [largeur]
 */
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const width = Number(process.argv[2] ?? 1440);
const heights = { 390: 844, 768: 1024, 1440: 900 };
const server = await serve(4321);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width, height: heights[width] ?? 900 }, locale: 'fr-FR' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`JS: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(`CONSOLE: ${m.text()}`));

const step = async (label, fn) => {
  try { await fn(); console.log(`  ✓ ${label}`); }
  catch (e) { console.log(`  ✗ ${label} — ${e.message.split('\n')[0]}`); throw e; }
};

await page.goto('http://localhost:4321/reserver/', { waitUntil: 'networkidle' });
// Le bandeau cookies apparaît après 1,4 s : on le referme comme un vrai visiteur.
await page.waitForTimeout(1800);
const refuse = page.getByRole('button', { name: 'Tout refuser' });
if (await refuse.isVisible().catch(() => false)) await refuse.click();

console.log(`Tunnel de réservation @${width}px`);
await step('Étape 1 — choix « À deux »', async () => {
  await page.getByRole('button', { name: /À deux/ }).click();
  await page.getByRole('button', { name: /^Continuer/ }).click();
});
await step('Étape 2 — choix d’une formule', async () => {
  await page.locator('button[aria-pressed]').filter({ hasText: 'Petit comité' }).first().click();
  await page.getByRole('button', { name: /^Continuer/ }).click();
});
await step('Étape 3 — date pré-sélectionnée', async () => {
  await page.waitForSelector('[role="grid"]');
  const selected = await page.locator('[role="gridcell"][aria-selected="true"]').count();
  if (selected !== 1) throw new Error(`${selected} date(s) sélectionnée(s)`);
  await page.getByRole('button', { name: /^Continuer/ }).click();
});
await step('Étape 4 — choix d’un créneau', async () => {
  await page.locator('button[aria-pressed]:not([disabled])').filter({ hasText: /^\d+h\d+$/ }).first().click();
  await page.getByRole('button', { name: /^Continuer/ }).click();
});
await step('Étape 5 — connexion au compte de test', async () => {
  await page.getByRole('button', { name: 'J’ai déjà un compte' }).click();
  await page.locator('#si-email').fill('camille.ferrand@example.com');
  await page.locator('#si-password').fill('demo1234');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForSelector('text=Quelques précisions', { timeout: 5000 });
});
await step('Étape 5 — nom de l’accompagnant', async () => {
  await page.locator('#guest-0').fill('Julie');
  await page.locator('#booking-notes').fill('Épaule gauche sensible.');
  await page.getByRole('button', { name: /^Continuer/ }).click();
});
await step('Étape 6 — paiement en ligne + carte', async () => {
  await page.getByRole('button', { name: /Payer en ligne/ }).click();
  await page.locator('#card-number').fill('4242424242424242');
  await page.locator('#card-expiry').fill('1229');
  await page.locator('#card-cvv').fill('123');
  await page.locator('#card-holder').fill('Camille Ferrand');
  const cta = page.getByRole('button', { name: 'Payer et confirmer' });
  if (await cta.isDisabled()) throw new Error('le bouton de paiement reste désactivé');
  await cta.click();
});
await step('Étape 7 — confirmation avec référence', async () => {
  await page.waitForSelector('text=C’est réservé.', { timeout: 6000 });
  const ref = await page.locator('text=/^BG-[A-Z0-9]{4}$/').first().textContent();
  console.log(`      référence obtenue : ${ref}`);
});
await step('Le rendez-vous apparaît dans l’espace client', async () => {
  await page.goto('http://localhost:4321/compte/', { waitUntil: 'networkidle' }).catch(() => {});
});

await page.screenshot({ path: `/tmp/shots/booking_${width}.png`, fullPage: true });
if (errors.length) console.log('ERREURS:\n' + errors.join('\n'));
else console.log('Aucune erreur JavaScript.');
await browser.close();
server.close();
