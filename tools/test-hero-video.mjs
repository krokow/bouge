/**
 * Test de la vidéo de fond du hero.
 *   node tools/test-hero-video.mjs
 *
 * Vérifie le choix de la source selon la largeur d'écran, la lecture
 * automatique et le fondu — y compris avec la préférence « animations
 * réduites » activée, puisque la vidéo ne doit plus être bridée.
 *
 * Le fichier H.264 est remplacé à la volée par un équivalent WebM : le
 * Chromium livré avec Playwright est une compilation sans codecs
 * propriétaires, il ne sait pas décoder H.264. Cela ne dit donc rien de la
 * lecture du vrai fichier dans un navigateur de bureau, mais tout de la
 * logique du composant.
 *
 * Prérequis : un fichier WebM de test, généré par
 *   ffmpeg -t 4 -i public/media/hero.mp4 -an -vf scale=480:270 \
 *     -c:v libvpx-vp9 -b:v 300k <scratchpad>/hero-test.webm
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const S = '/tmp/claude-0/-home-user-bouge/2879e1ef-b665-5d5c-ab41-2642ce1b5820/scratchpad';
const webm = readFileSync(`${S}/hero-test.webm`);
const server = await serve(4458);
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

for (const [label, opts, expected] of [
  ['réglages standards', { viewport: { width: 1440, height: 900 } }, 'hero.mp4'],
  ['animations réduites', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, 'hero.mp4'],
  ['téléphone', { viewport: { width: 390, height: 844 } }, 'hero-mobile.mp4'],
  ['téléphone en paysage', { viewport: { width: 667, height: 375 } }, 'hero.mp4'],
]) {
  const ctx = await b.newContext(opts);
  const p = await ctx.newPage();
  let requested = null;
  // Le fichier H.264 est remplacé à la volée par son équivalent WebM.
  await p.route('**/media/hero*.mp4', (route) => {
    requested = route.request().url().split('/').pop();
    route.fulfill({ status: 200, headers: { 'content-type': 'video/webm' }, body: webm });
  });
  await p.goto('http://localhost:4458/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2600);
  const st = await p.evaluate(() => {
    const v = document.querySelector('video');
    return { paused: v.paused, t: Number(v.currentTime.toFixed(2)), ready: v.readyState, opacity: getComputedStyle(v).opacity };
  });
  const ok = requested === expected && !st.paused && st.t > 0 && st.opacity === '1';
  console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(22)} source demandée: ${requested}  lecture: ${st.t}s  opacité: ${st.opacity}`);
  await ctx.close();
}
// Économie d'énergie iOS : toute lecture sans geste de l'utilisateur est
// refusée. Simulé en faisant échouer play() tant que la page n'a pas été
// touchée. Attendu : vidéo invisible (donc aucun bouton « lecture »), affiche
// visible, puis lecture dès le premier geste.
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    let allowed = false;
    for (const e of ['touchend', 'pointerdown', 'click']) window.addEventListener(e, () => { allowed = true; }, { capture: true });
    // L'attribut autoplay est ignoré, comme sur iOS en économie d'énergie.
    const setAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (n, v) {
      if (this instanceof HTMLMediaElement && n.toLowerCase() === 'autoplay') return;
      return setAttr.call(this, n, v);
    };
    Object.defineProperty(HTMLMediaElement.prototype, 'autoplay', { get: () => false, set: () => {} });
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      return allowed ? play.call(this) : Promise.reject(new DOMException('Low power mode', 'NotAllowedError'));
    };
  });
  const p = await ctx.newPage();
  await p.route('**/media/hero*.mp4', (route) => route.fulfill({ status: 200, headers: { 'content-type': 'video/webm' }, body: webm }));
  await p.goto('http://localhost:4458/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const state = () => p.evaluate(() => {
    const v = document.querySelector('video');
    return { paused: v.paused, opacity: getComputedStyle(v).opacity, pe: getComputedStyle(v).pointerEvents, controls: v.controls };
  });
  const before = await state();
  const hidden = before.paused && before.opacity === '0' && before.pe === 'none' && !before.controls;
  console.log(`  ${hidden ? '✓' : '✗'} économie d'énergie : vidéo masquée tant qu'elle ne joue pas (pause: ${before.paused}, opacité: ${before.opacity}, clics: ${before.pe})`);
  // Tap sur le titre du hero, zone neutre (aucun lien).
  const h = await p.locator('h1, h2').first().boundingBox();
  await p.touchscreen.tap(h.x + 4, h.y + h.height / 2);
  await p.waitForTimeout(1500);
  const after = await state();
  const started = !after.paused && after.opacity === '1';
  console.log(`  ${started ? '✓' : '✗'} économie d'énergie : lecture au premier contact (pause: ${after.paused}, opacité: ${after.opacity})`);
  await ctx.close();
}

await b.close(); server.close();
