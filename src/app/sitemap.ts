import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/config';

// Export statique : le fichier est produit une fois au build, jamais à la volée.
export const dynamic = 'force-static';

/** Plan de site limité aux pages publiques indexables. */
const ROUTES: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/offres/', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/reserver/', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/studio/', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/osteopathie/', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/a-propos/', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/contact/', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/mentions-legales/', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/cgv/', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/confidentialite/', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${SITE.url}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
