/**
 * Captures de contrôle du site exporté.
 *   node tools/screenshot.mjs <chemin> [largeurs...]
 * Sert le dossier `out/` puis photographie la page aux largeurs demandées.
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const ROOT = new URL('../out/', import.meta.url).pathname;
const OUT_DIR = process.env.SHOT_DIR ?? '/tmp/shots';
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json',
};

const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(req.url.split('?')[0]);
    let file = join(ROOT, normalize(path));
    if (!extname(file)) file = join(file, 'index.html');
    if (!existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});

const [, , page = '/', ...widthArgs] = process.argv;
const widths = widthArgs.length ? widthArgs.map(Number) : [390, 768, 1440];
/** Hauteurs réalistes des appareils visés, pour juger du premier écran. */
const HEIGHTS = { 375: 812, 390: 844, 430: 932, 768: 1024, 1024: 768, 1280: 800, 1440: 900, 1920: 1080 };
const heightFor = (w) => HEIGHTS[w] ?? Math.round(w * 0.62);

await mkdir(OUT_DIR, { recursive: true });
await new Promise((r) => server.listen(4321, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const name = page.replace(/\W+/g, '_') || 'home';
const errors = [];

for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: heightFor(width) }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.on('console', (m) => m.type() === 'error' && errors.push(`[${width}] ${m.text()}`));
  p.on('pageerror', (e) => errors.push(`[${width}] ${e.message}`));
  p.on('response', (r) => r.status() >= 400 && errors.push(`[${width}] ${r.status()} ${r.url()}`));
  await p.goto(`http://localhost:4321${page}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  // Déroule la page pour déclencher toutes les révélations au défilement.
  await p.evaluate(async () => {
    const step = 260; // petits pas : l'IntersectionObserver ne saute aucun élément
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 45));
    }
    window.scrollTo({ top: 0, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 450));
  });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const hidden = await p.evaluate(() =>
    [...document.querySelectorAll('article, li, h2, h3')].filter((el) => getComputedStyle(el).opacity === '0').length,
  );
  if (hidden) console.log(`  ⚠ ${hidden} éléments encore invisibles`);
  await p.screenshot({ path: `${OUT_DIR}/${name}_${width}.png`, fullPage: true });
  console.log(`${name} @${width}px  débordement horizontal: ${overflow}px`);
  await ctx.close();
}

if (errors.length) console.log('ERREURS CONSOLE:\n' + errors.join('\n'));
await browser.close();
server.close();
