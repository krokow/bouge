/**
 * Export statique : le site se déploie sur n'importe quel hébergeur de fichiers
 * (GitLab Pages, GitHub Pages, puis un OVH mutualisé) sans serveur Node.
 *
 * BASE_PATH permet de servir le site depuis un sous-répertoire :
 *   - GitLab Pages  → https://<groupe>.gitlab.io/bouge   → BASE_PATH=/bouge
 *   - GitHub Pages  → https://<user>.github.io/bouge     → BASE_PATH=/bouge
 *   - Domaine dédié → https://bouge-studio.fr            → BASE_PATH=""  (défaut)
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  // Un hébergement statique sert mieux /reserver/index.html que /reserver.html
  trailingSlash: true,
  images: {
    // Pas de serveur d'optimisation d'images en export statique : les visuels
    // sont déjà compressés en WebP à la génération (tools/build-brand-assets.py).
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
