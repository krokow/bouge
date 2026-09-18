/**
 * Multi-coach : réservation, cloisonnement des espaces, gestion de l'équipe.
 *   node tools/test-coaches.mjs [largeur]
 */
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const width = Number(process.argv[2] ?? 1440);
const PORT = Number(process.env.TEST_PORT ?? 4336);
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

const login = async (email, password) => {
  await page.goto(`http://localhost:${PORT}/connexion/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  const refuse = page.getByRole('button', { name: 'Tout refuser' });
  if (await refuse.isVisible().catch(() => false)) await refuse.click();
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('form').getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForURL('**/admin/**', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(900);
};

const logout = async () => {
  const out = page.getByRole('button', { name: 'Déconnexion' });
  if (await out.isVisible().catch(() => false)) { await out.click(); await page.waitForTimeout(800); }
};

/**
 * Sous 1280 px, la navigation de l'espace gérant affiche des libellés courts
 * (le long est masqué par `xl:hidden`). Le test doit viser le bon, sinon il
 * échoue pour une raison qui n'a rien à voir avec ce qu'il vérifie.
 */
const SHORT = {
  'Vue d’ensemble': 'Accueil',
  Calendrier: 'Agenda',
  Réservations: 'RDV',
  Indisponibilités: 'Blocages',
  'Qui assure quoi': 'Coachs',
  'L’équipe': 'Équipe',
  Statistiques: 'Stats',
  'Emails envoyés': 'Emails',
};
const sectionName = (name) => (width < 1280 ? (SHORT[name] ?? name) : name);

const openSection = async (name) => {
  await page.getByRole('button', { name: sectionName(name), exact: true }).first().click();
  await page.waitForTimeout(500);
};

console.log(`Multi-coach @${width}px`);

/* ---------------------------------------------------------------- Vitrine */
await step('Page À propos : la section « L’équipe » apparaît', async () => {
  await page.goto(`http://localhost:${PORT}/a-propos/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const refuse = page.getByRole('button', { name: 'Tout refuser' });
  if (await refuse.isVisible().catch(() => false)) await refuse.click();
  await page.getByText('Melvin, et ceux qui prennent le relais').first().waitFor({ timeout: 4000 });
  for (const n of ['Melvin', 'Sarah', 'Karim']) {
    if (!(await page.getByText(n, { exact: false }).first().isVisible())) throw new Error(`${n} absent`);
  }
});

/* --------------------------------------------------- Espace du gérant */
await step('Melvin accède à l’espace gérant, avec l’équipe et les affectations', async () => {
  await login('melvin@bouge-studio.fr', 'bouge2026');
  if (!page.url().includes('/admin/')) throw new Error(`redirigé vers ${page.url()}`);
  for (const s of ['L’équipe', 'Qui assure quoi']) {
    if (!(await page.getByRole('button', { name: sectionName(s), exact: true }).first().isVisible())) {
      throw new Error(`section « ${s} » absente`);
    }
  }
});

let studioBookings = 0;
await step('Vue « tout le studio » : toutes les réservations', async () => {
  await openSection('Réservations');
  studioBookings = await page.locator('tbody tr, li:has-text("BG-")').count();
  if (studioBookings === 0) throw new Error('aucune réservation listée');
  console.log(`      ${studioBookings} lignes côté studio`);
});

let sarahBookings = 0;
await step('Melvin bascule dans l’espace de Sarah : la liste se réduit', async () => {
  await page.getByRole('button', { name: /^Sarah/ }).first().click();
  await page.waitForTimeout(700);
  sarahBookings = await page.locator('tbody tr, li:has-text("BG-")').count();
  if (sarahBookings >= studioBookings) {
    throw new Error(`${sarahBookings} lignes pour Sarah contre ${studioBookings} pour le studio`);
  }
  if (sarahBookings === 0) throw new Error('Sarah n’a aucune séance : le jeu de démonstration est muet');
  console.log(`      ${sarahBookings} lignes pour Sarah`);
});

await step('L’en-tête annonce l’espace consulté', async () => {
  await page.getByText('Espace de Sarah').first().waitFor({ timeout: 3000 });
});

await step('Ajout d’un coach depuis « L’équipe »', async () => {
  await page.getByRole('button', { name: 'Tout le studio', exact: true }).click();
  await page.waitForTimeout(400);
  await openSection('L’équipe');
  await page.getByRole('button', { name: 'Ajouter un coach' }).click();
  await page.locator('#coach-firstname').fill('Nadia');
  await page.locator('#coach-lastname').fill('Roussel');
  await page.locator('#coach-email').fill('nadia@bouge-studio.fr');
  await page.locator('#coach-password').fill('bouge2026');
  await page.getByRole('button', { name: 'Ajouter à l’équipe' }).click();
  await page.waitForTimeout(800);
  await page.getByText('Nadia Roussel').first().waitFor({ timeout: 3000 });
});

await step('Un coach sans photo affiche ses initiales', async () => {
  const initials = page.getByText('NR', { exact: true }).first();
  if (!(await initials.isVisible())) throw new Error('initiales absentes');
});

await step('Retirer un coach qui a des séances à venir est refusé', async () => {
  page.once('dialog', (d) => d.accept());
  const card = page.locator('article').filter({ hasText: 'Sarah Lemoine' }).first();
  await card.getByRole('button', { name: 'Retirer' }).click();
  await page.waitForTimeout(700);
  const alert = page.getByText(/séances? à venir/i).first();
  if (!(await alert.isVisible())) throw new Error('aucun refus affiché');
});

await step('Confier une journée à un coach', async () => {
  await openSection('Qui assure quoi');
  const form = page.locator('form').filter({ hasText: 'Confier une plage' });
  await form.getByRole('button', { name: /^Karim/ }).first().click();
  await form.getByRole('button', { name: 'Une journée' }).click();
  await page.locator('#assign-note').fill('Test automatisé');
  await form.getByRole('button', { name: 'Confier cette plage' }).click();
  await page.waitForTimeout(700);
  await page.getByText('Test automatisé').first().waitFor({ timeout: 3000 });
});

await logout();

/* ------------------------------------------------------ Espace d'un coach */
await step('Sarah se connecte et arrive dans son espace', async () => {
  await login('sarah@bouge-studio.fr', 'bouge2026');
  if (!page.url().includes('/admin/')) throw new Error(`redirigée vers ${page.url()}`);
  await page.getByText('Espace de Sarah').first().waitFor({ timeout: 3000 });
});

await step('La barre de navigation envoie Sarah vers son tableau de bord', async () => {
  // Le bug : la navbar testait « rôle == admin » et renvoyait donc les coachs
  // vers l'espace client, où ils ne trouvent rien.
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const lien = page.getByRole('link', { name: 'Tableau de bord' }).first();
  if ((await lien.count()) === 0) {
    const autre = await page.getByRole('link', { name: 'Mon espace' }).count();
    throw new Error(autre > 0 ? 'la navbar propose « Mon espace » à un coach' : 'aucun lien d’espace');
  }
  await lien.click();
  await page.waitForTimeout(1200);
  if (!page.url().includes('/admin/')) throw new Error(`le lien mène à ${page.url()}`);
});

await step('Un coach qui ouvre /compte/ est renvoyé vers son tableau de bord', async () => {
  // Corriger le lien ne suffit pas : restent les favoris et les adresses
  // tapées à la main.
  await page.goto(`http://localhost:${PORT}/compte/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  if (!page.url().includes('/admin/')) throw new Error(`resté sur ${page.url()}`);
});

await step('Sarah n’a ni « L’équipe », ni « Qui assure quoi », ni sélecteur de périmètre', async () => {
  for (const s of ['L’équipe', 'Qui assure quoi']) {
    if (await page.getByRole('button', { name: sectionName(s), exact: true }).first().isVisible().catch(() => false)) {
      throw new Error(`section « ${s} » visible par un coach`);
    }
  }
  if (await page.getByText('Espace consulté').first().isVisible().catch(() => false)) {
    throw new Error('le sélecteur de périmètre est visible par un coach');
  }
});

await step('Sarah ne voit que ses propres réservations', async () => {
  await openSection('Réservations');
  const rows = await page.locator('tbody tr, li:has-text("BG-")').count();
  if (rows === 0) throw new Error('aucune réservation');
  if (rows >= studioBookings) throw new Error(`${rows} lignes, autant que le studio entier`);
  console.log(`      ${rows} lignes vues par Sarah (studio : ${studioBookings})`);
});

await step('Son agenda montre les créneaux pris par d’autres, sans nommer leurs clients', async () => {
  await openSection('Calendrier');
  await page.waitForTimeout(600);
  const anonymous = await page.getByText(/^Séance · /).count();
  if (anonymous === 0) throw new Error('aucun créneau de collègue affiché');
  console.log(`      ${anonymous} créneaux anonymisés`);
});

await step('Ses séances et celles des autres n’ont pas la même couleur', async () => {
  // La couleur doit porter l'information : dans une case de grille, le
  // libellé « Séance · Untel » est tronqué et demande d'être lu.
  const tally = await page.evaluate(() => {
    const out = {};
    for (const b of document.querySelectorAll('table button')) {
      const bg = getComputedStyle(b).backgroundColor;
      out[bg] = (out[bg] ?? 0) + 1;
    }
    return out;
  });
  const fonds = Object.keys(tally);
  // Orange plein pour ses séances, brun translucide pour celles des autres.
  const own = fonds.find((c) => c.includes('226, 97, 41'));
  const others = fonds.find((c) => c.includes('0.406155') || c.includes('89, 68, 58'));
  if (!others) throw new Error(`aucun créneau au fond « autre coach » — fonds vus : ${fonds.join(' | ')}`);
  if (own === others) throw new Error('mêmes couleurs pour ses séances et celles des autres');
  console.log(`      ${tally[others]} créneaux « autre coach », ${own ? tally[own] : 0} à elle`);
});

await logout();
if (errors.length) console.log('ERREURS:\n' + errors.join('\n'));
else console.log('Aucune erreur JavaScript.');
console.log(failed === 0 ? 'Tout est conforme.' : `${failed} contrôle(s) en échec.`);
await browser.close();
server.close();
process.exit(failed === 0 ? 0 : 1);
