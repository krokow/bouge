import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/config';

// Export statique : le fichier est produit une fois au build, jamais à la volée.
export const dynamic = 'force-static';

/**
 * robots.txt généré au build.
 * Les espaces personnels et le tableau de bord n'ont rien à faire dans un
 * index de moteur de recherche.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/compte/', '/connexion/'],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
