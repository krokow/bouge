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
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});

for (const [label, opts] of [
  ['réglages standards', { viewport: { width: 1440, height: 900 } }],
  ['animations réduites', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }],
  ['téléphone', { viewport: { width: 390, height: 844 } }],
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
  const ok = !st.paused && st.t > 0 && st.opacity === '1';
  console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(22)} source demandée: ${requested}  lecture: ${st.t}s  opacité: ${st.opacity}`);
  await ctx.close();
}
await b.close(); server.close();
