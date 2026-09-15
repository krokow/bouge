/**
 * Vérifie que la préférence système « animations réduites » ne change RIEN :
 * même mise en page, mêmes animations, même comportement au défilement.
 *   node tools/test-reduced-motion.mjs
 */
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const PORT = Number(process.env.TEST_PORT ?? 4333);
const server = await serve(PORT);
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

/** Relève l'état des animations et de la mise en page sur une page donnée. */
async function probe(reducedMotion) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion, // 'reduce' ou 'no-preference'
  });
  const page = await ctx.newPage();

  // --- Page d'accueil : bandeau défilant, révélations, parallaxe ---
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.getByRole('button', { name: 'Tout refuser' }).click().catch(() => {});

  const marquee = await page.evaluate(() => {
    const el = document.querySelector('.u-marquee-track');
    const cs = getComputedStyle(el);
    return { duree: cs.animationDuration, iterations: cs.animationIterationCount };
  });

  // La parallaxe écrit une variable CSS au défilement.
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await page.waitForTimeout(400);
  const parallaxe = await page.evaluate(() => {
    const hero = document.querySelector('section[aria-label="Présentation du studio"] .u-container');
    return hero?.style.getPropertyValue('--hero-shift') || '(aucune)';
  });

  await page.evaluate(() => window.scrollTo({ top: 1600, behavior: 'instant' }));
  await page.waitForTimeout(900);
  const reveal = await page.evaluate(() => {
    const el = document.querySelector('.is-revealed');
    return el ? getComputedStyle(el).transitionDuration : '(aucun)';
  });

  // --- Page des offres : mode épinglé ou empilé ? ---
  await page.goto(`http://localhost:${PORT}/offres/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const offres = await page.evaluate(() => ({
    mode: document.querySelector('[role="tablist"]') ? 'épinglé' : 'empilé',
    hauteurSection: document.querySelector('[role="tablist"]')?.closest('section')?.firstElementChild?.offsetHeight ?? null,
  }));

  await ctx.close();
  return { marquee, parallaxe, reveal, offres };
}

const normal = await probe('no-preference');
const reduit = await probe('reduce');

const lignes = [
  ['bandeau défilant (durée)', normal.marquee.duree, reduit.marquee.duree],
  ['bandeau défilant (boucles)', normal.marquee.iterations, reduit.marquee.iterations],
  ['parallaxe du hero', normal.parallaxe, reduit.parallaxe],
  ['transition de révélation', normal.reveal, reduit.reveal],
  ['page Offres — mode', normal.offres.mode, reduit.offres.mode],
  ['page Offres — hauteur', String(normal.offres.hauteurSection), String(reduit.offres.hauteurSection)],
];

let identique = true;
console.log(`  ${'mesure'.padEnd(28)} ${'normal'.padEnd(18)} animations réduites`);
for (const [label, a, b] of lignes) {
  const ok = a === b;
  if (!ok) identique = false;
  console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(26)} ${String(a).padEnd(18)} ${b}`);
}
console.log(identique ? '\n  Comportement strictement identique.' : '\n  ⚠ Des différences subsistent.');

await browser.close();
server.close();
process.exit(identique ? 0 : 1);
