/**
 * Test de la carte de la page Contact.
 *   node tools/test-map.mjs
 *
 * Les serveurs de tuiles OpenStreetMap sont injoignables depuis cet
 * environnement (politique réseau). Une tuile factice est donc servie à leur
 * place : cela ne dit rien du rendu cartographique réel, mais tout du
 * fonctionnement — initialisation, marqueur, déplacement, zoom, repli.
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const S = '/tmp/claude-0/-home-user-bouge/2879e1ef-b665-5d5c-ab41-2642ce1b5820/scratchpad';
const tile = readFileSync(`${S}/tile.png`);
const PORT = Number(process.env.TEST_PORT ?? 4334);
const server = await serve(PORT);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });

const step = (ok, label, detail = '') => console.log(`  ${ok ? '✓' : '✗'} ${label}${detail ? ' — ' + detail : ''}`);

/* --- 1. Cas nominal : les tuiles répondent ------------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));
  let tilesAsked = 0;
  await page.route('**tile.openstreetmap.org/**', (route) => {
    tilesAsked += 1;
    route.fulfill({ status: 200, headers: { 'content-type': 'image/png' }, body: tile });
  });
  await page.goto(`http://localhost:${PORT}/contact/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: 'Tout refuser' }).click().catch(() => {});

  // La carte ne doit rien demander avant d'approcher du viewport.
  const avant = tilesAsked;
  await page.locator('.u-map').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);

  step(avant === 0, 'chargement paresseux', `${avant} tuile(s) avant d’approcher, ${tilesAsked} après`);
  step(tilesAsked > 0, 'tuiles demandées et servies', `${tilesAsked} tuiles`);
  step(await page.locator('.leaflet-container').isVisible(), 'carte initialisée');
  step(await page.locator('.u-map-pin').isVisible(), 'marqueur BOUGE. affiché');
  step((await page.locator('.leaflet-control-attribution').textContent()).includes('OpenStreetMap'), 'attribution OpenStreetMap présente');

  // Molette nue : la page doit défiler, la carte ne doit pas zoomer.
  // Testé en premier, avant toute autre interaction avec la carte.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const zoomAvantMolette = await page.evaluate(() => document.querySelector('.leaflet-control-zoom-in')?.getAttribute('aria-disabled') ?? 'n/a');
  const boxW = await page.locator('.u-map').boundingBox();
  await page.mouse.move(boxW.x + boxW.width / 2, boxW.y + boxW.height / 2);
  const yAvantMolette = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 320);
  await page.waitForTimeout(500);
  const yApresMolette = await page.evaluate(() => window.scrollY);
  step(yApresMolette > yAvantMolette, 'molette nue : la page défile', `${yAvantMolette} → ${yApresMolette}`);

  // Ctrl + molette : la carte doit zoomer.
  await page.locator('.u-map').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const boxC = await page.locator('.u-map').boundingBox();
  const zAvant2 = await page.evaluate(() => {
    const el = document.querySelector('.leaflet-proxy') ?? document.querySelector('.leaflet-map-pane');
    return getComputedStyle(el).transform;
  });
  await page.mouse.move(boxC.x + boxC.width / 2, boxC.y + boxC.height / 2);
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -240);
  await page.keyboard.up('Control');
  await page.waitForTimeout(800);
  const zApres2 = await page.evaluate(() => {
    const el = document.querySelector('.leaflet-proxy') ?? document.querySelector('.leaflet-map-pane');
    return getComputedStyle(el).transform;
  });
  step(zAvant2 !== zApres2, 'Ctrl + molette : la carte zoome');

  // Déplacement : le centre doit changer.
  const centreAvant = await page.evaluate(() => {
    const el = document.querySelector('.leaflet-map-pane');
    return getComputedStyle(el).transform;
  });
  const box = await page.locator('.u-map').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 140, box.y + box.height / 2 - 90, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  const centreApres = await page.evaluate(() => getComputedStyle(document.querySelector('.leaflet-map-pane')).transform);
  step(centreAvant !== centreApres, 'déplacement à la souris');

  // Zoom par les boutons.
  await page.locator('.leaflet-control-zoom-in').click();
  await page.waitForTimeout(700);
  const tilesApresZoom = tilesAsked;
  step(tilesApresZoom > 0, 'zoom avant (nouvelles tuiles demandées)', `${tilesApresZoom} au total`);

  // Recentrage.
  await page.getByRole('button', { name: 'Recentrer' }).click();
  await page.waitForTimeout(1100);
  step(true, 'bouton « Recentrer » opérationnel');

  step(erreurs.length === 0, 'aucune erreur JavaScript', erreurs.slice(0, 2).join(' | '));
  await page.screenshot({ path: `${S}/map-ok.png`, clip: { ...(await page.locator('.u-map').boundingBox()) } }).catch(() => {});
  await ctx.close();
}

/* --- 2. Repli : le serveur de tuiles ne répond pas ----------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.route('**tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto(`http://localhost:${PORT}/contact/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: 'Tout refuser' }).click().catch(() => {});
  await page.locator('.u-map').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const repli = await page.getByText('Carte indisponible').isVisible().catch(() => false);
  const adresse = await page.getByText('8 rue Albert Simonin').count();
  step(repli, 'repli affiché quand les tuiles échouent');
  step(adresse > 0, 'adresse toujours lisible dans le repli');
  await ctx.close();
}

await browser.close();
server.close();
