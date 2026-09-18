/**
 * Sorties collectives gratuites : affichage, inscription, gestion.
 *   node tools/test-runs.mjs [largeur]
 */
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const width = Number(process.argv[2] ?? 1440);
const PORT = Number(process.env.TEST_PORT ?? 4338);
const server = await serve(PORT);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width, height: 900 }, locale: 'fr-FR' });
const page = await ctx.newPage();
const errors = [];
let failed = 0;
page.on('pageerror', (e) => errors.push(`JS: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(`CONSOLE: ${m.text()}`));

const step = async (label, fn) => {
  try { await fn(); console.log(`  ✓ ${label}`); }
  catch (e) { failed += 1; console.log(`  ✗ ${label} — ${e.message.split('\n')[0]}`); }
};

const SHORT = { 'Vue d’ensemble':'Accueil', Calendrier:'Agenda', Réservations:'RDV', Indisponibilités:'Blocages',
  'Qui assure quoi':'Coachs', 'L’équipe':'Équipe', 'Les runs':'Runs', Statistiques:'Stats', 'Emails envoyés':'Emails' };
const sectionName = (n) => (width < 1280 ? (SHORT[n] ?? n) : n);
const openSection = async (n) => {
  await page.getByRole('button', { name: sectionName(n), exact: true }).first().click();
  await page.waitForTimeout(500);
};

const consent = async () => {
  await page.waitForTimeout(1600);
  const refuse = page.getByRole('button', { name: 'Tout refuser' });
  if (await refuse.isVisible().catch(() => false)) await refuse.click();
};

const login = async (email, password) => {
  await page.goto(`http://localhost:${PORT}/connexion/`, { waitUntil: 'networkidle' });
  await consent();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('form').getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForTimeout(1200);
};

const logout = async () => {
  for (const label of ['Déconnexion', 'Se déconnecter']) {
    const out = page.getByRole('button', { name: label });
    if (await out.first().isVisible().catch(() => false)) {
      await out.first().click();
      await page.waitForTimeout(900);
      return;
    }
  }
};

console.log(`Sorties collectives @${width}px`);

/* ------------------------------------------------------------- Site public */
await step('L’accueil annonce les prochaines sorties', async () => {
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await consent();
  const sec = page.locator('section').filter({ hasText: 'Les runs BOUGE.' }).first();
  await sec.scrollIntoViewIfNeeded();
  await sec.getByText(/places? libres?|Complet/).first().waitFor({ timeout: 4000 });
  const cards = await sec.locator('article').count();
  if (cards === 0) throw new Error('aucune sortie affichée');
  console.log(`      ${cards} sorties annoncées sur l’accueil`);
});

await step('La page Nos offres reprend la section', async () => {
  await page.goto(`http://localhost:${PORT}/offres/#les-runs`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);
  await page.getByText('Les runs BOUGE.').first().waitFor({ timeout: 4000 });
});

/* --------------------------------------------------------- Inscription */
await step('Un visiteur connecté prend sa place', async () => {
  await login('claire.vasseur@example.com', 'demo1234');
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);
  const sec = page.locator('section').filter({ hasText: 'Les runs BOUGE.' }).first();
  await sec.scrollIntoViewIfNeeded();
  const card = sec.locator('article').first();
  const before = Number((await card.getByText(/^\d+$/).first().textContent()) ?? '0');
  await card.getByRole('button', { name: /Je prends ma place/ }).click();
  await page.waitForTimeout(900);
  await card.getByText('Vous y êtes inscrit').waitFor({ timeout: 4000 });
  const after = Number((await card.getByText(/^\d+$/).first().textContent()) ?? '0');
  if (after !== before - 1) throw new Error(`places : ${before} → ${after}, attendu ${before - 1}`);
  console.log(`      places restantes : ${before} → ${after}`);
});

let mySection;
await step('L’inscription apparaît dans l’espace client', async () => {
  await page.goto(`http://localhost:${PORT}/compte/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  // Repère explicite : filtrer les <section> par leur texte attrapait aussi
  // la section englobante, donc les cartes de séances.
  mySection = page.locator('#mes-sorties');
  await mySection.waitFor({ timeout: 4000 });
  const listed = await mySection.locator('article').count();
  if (listed === 0) throw new Error('aucune sortie listée');
  console.log(`      ${listed} sortie(s) dans l’espace client`);
});

await step('La désinscription retire la sortie de l’espace client', async () => {
  // On compte les cartes plutôt que le titre de la section : une personne
  // peut être inscrite à plusieurs sorties, le titre resterait affiché.
  const before = await mySection.locator('article').count();
  await mySection.getByRole('button', { name: 'Me désinscrire' }).first().click();
  await page.waitForTimeout(1000);
  const after = await page.locator('#mes-sorties article').count();
  if (after !== before - 1) throw new Error(`${before} → ${after} sorties, attendu ${before - 1}`);
  console.log(`      sorties inscrites : ${before} → ${after}`);
});

await logout();

/* ----------------------------------------------------------- Espace gérant */
await step('Melvin dispose de la section « Les runs »', async () => {
  await login('melvin@bouge-studio.fr', 'bouge2026');
  await openSection('Les runs');
  await page.getByText('Programmer une sortie').first().waitFor({ timeout: 4000 });
});

await step('La liste des inscrits est consultable', async () => {
  await page.getByText('Voir les inscrits').first().click();
  await page.waitForTimeout(300);
  const mails = await page.locator('a[href^="mailto:"]').count();
  if (mails === 0) throw new Error('aucun contact affiché');
  console.log(`      ${mails} contacts récupérables`);
});

await step('Programmer une nouvelle sortie', async () => {
  await page.locator('#run-title').fill('Sortie de test');
  await page.locator('#run-place').fill('Parc de Bécon');
  await page.getByRole('button', { name: 'Programmer la sortie' }).click();
  await page.waitForTimeout(900);
  await page.getByText('Sortie de test').first().waitFor({ timeout: 4000 });
});

await step('Deux sorties ne peuvent pas se superposer', async () => {
  await page.getByRole('button', { name: 'Programmer la sortie' }).click();
  await page.waitForTimeout(700);
  await page.getByText(/déjà programmée sur ce créneau/).first().waitFor({ timeout: 4000 });
});

await step('Le calendrier montre la sortie et ne la transforme pas en blocage', async () => {
  await openSection('Calendrier');
  await page.waitForTimeout(800);
  const cell = page.locator('table button').filter({ hasText: 'Run du samedi' }).first();
  if ((await cell.count()) === 0) throw new Error('la sortie n’apparaît pas dans la grille');
  const before = await cell.getAttribute('class');
  await cell.click();
  await page.waitForTimeout(500);
  const after = await cell.getAttribute('class');
  if (before !== after) throw new Error('un clic a modifié le créneau de sortie');
});

await step('Le créneau d’une sortie n’est réservable par personne', async () => {
  // Contrôle de bout en bout, depuis le tunnel public : on ouvre la date de
  // la sortie et on vérifie que son heure n'est pas proposée.
  await logout();
  await page.goto(`http://localhost:${PORT}/reserver/`, { waitUntil: 'networkidle' });
  await consent();

  const run = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('bouge.db.v6') ?? '{}');
    const open = (db.runs ?? [])
      .filter((r) => r.status === 'open' && r.date >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => a.date.localeCompare(b.date));
    return open[0] ?? null;
  });
  if (!run) throw new Error('aucune sortie à venir en base');

  await page.getByRole('button', { name: /Seul/ }).click();
  await page.getByRole('button', { name: /^Continuer/ }).click();
  await page.waitForTimeout(300);
  await page.locator('button[aria-pressed]').filter({ hasText: 'Découverte' }).first().click();
  await page.getByRole('button', { name: /^Continuer/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^Continuer/ }).click(); // « Peu importe »
  await page.waitForTimeout(700);

  // Le calendrier peut être sur un autre mois que la sortie.
  for (let i = 0; i < 4; i += 1) {
    if ((await page.locator(`[data-date="${run.date}"]`).count()) > 0) break;
    await page.getByRole('button', { name: /Mois suivant|suivant/i }).first().click().catch(() => {});
    await page.waitForTimeout(400);
  }
  const cell = page.locator(`[data-date="${run.date}"]`);
  if ((await cell.count()) === 0) throw new Error(`date ${run.date} introuvable dans le calendrier`);
  if (await cell.isDisabled()) {
    console.log(`      ${run.date} entièrement fermé : la sortie ne peut être réservée`);
    return;
  }
  await cell.click();
  await page.waitForTimeout(700);

  const hhmm = `${run.startTime.slice(0, 2)}h${run.startTime.slice(3)}`;
  const offered = await page
    .locator('button[aria-pressed]:not([disabled])')
    .filter({ hasText: new RegExp(`^${hhmm}`) })
    .count();
  if (offered > 0) throw new Error(`le créneau ${hhmm} de la sortie est proposé à la réservation`);
  console.log(`      ${run.date} ${hhmm} : créneau bien retiré de la réservation`);
});

await step('Une sortie annulée disparaît du site', async () => {
  // L'étape précédente s'est déroulée déconnectée : on revient en gérant.
  await login('melvin@bouge-studio.fr', 'bouge2026');
  await openSection('Les runs');

  const target = page.locator('li').filter({ hasText: 'Sortie de test' }).first();
  if ((await target.count()) === 0) throw new Error('la sortie de test est introuvable');

  page.once('dialog', (d) => d.accept());
  await target.getByRole('button', { name: 'Annuler la sortie' }).click();
  await page.waitForTimeout(900);
  await page.locator('li').filter({ hasText: 'Sortie de test' }).first().getByText('Annulée').waitFor({ timeout: 4000 });
  // Et surtout : elle ne doit plus être annoncée aux visiteurs.
  await logout();
  await page.goto(`http://localhost:${PORT}/offres/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const stillPublic = await page.getByText('Sortie de test').count();
  if (stillPublic > 0) throw new Error('la sortie annulée est encore annoncée sur le site');
});

await logout();
if (errors.length) console.log('ERREURS:\n' + errors.join('\n'));
else console.log('Aucune erreur JavaScript.');
console.log(failed === 0 ? 'Tout est conforme.' : `${failed} contrôle(s) en échec.`);
await browser.close();
server.close();
process.exit(failed === 0 ? 0 : 1);
