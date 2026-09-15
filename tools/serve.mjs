/** Petit serveur statique pour tester le dossier `out/` localement. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../out/', import.meta.url).pathname;
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json', '.ics': 'text/calendar',
};

export function serve(port = 4321) {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url.split('?')[0]);
      let file = join(ROOT, normalize(path));
      if (!extname(file)) file = join(file, 'index.html');
      if (!existsSync(file)) {
        res.writeHead(404, { 'content-type': 'text/html' });
        return res.end(await readFile(join(ROOT, '404.html')).catch(() => 'not found'));
      }

      const type = TYPES[extname(file)] ?? 'application/octet-stream';
      const body = await readFile(file);

      // Les lecteurs vidéo des navigateurs envoient « Range: bytes=0- » et
      // abandonnent si le serveur répond 200 sans gérer les plages. Les
      // hébergeurs statiques (GitHub/GitLab Pages, OVH) le gèrent nativement ;
      // il faut donc que le serveur de test le fasse aussi, sans quoi les
      // vérifications de la vidéo échouent pour une mauvaise raison.
      const range = req.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match) {
          const start = match[1] ? Number(match[1]) : 0;
          const end = match[2] ? Number(match[2]) : body.length - 1;
          const chunk = body.subarray(start, end + 1);
          res.writeHead(206, {
            'content-type': type,
            'content-length': chunk.length,
            'content-range': `bytes ${start}-${end}/${body.length}`,
            'accept-ranges': 'bytes',
          });
          return res.end(chunk);
        }
      }

      res.writeHead(200, {
        'content-type': type,
        'content-length': body.length,
        'accept-ranges': 'bytes',
      });
      res.end(body);
    } catch (error) {
      res.writeHead(500);
      res.end(String(error));
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await serve(Number(process.argv[2] ?? 4321));
  console.log('http://localhost:4321');
}
