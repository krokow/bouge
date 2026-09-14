import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { CookieBanner } from '@/components/layout/CookieBanner';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { asset, SITE, STUDIO } from '@/lib/config';
import './globals.css';

/**
 * Polices de la charte, auto-hébergées.
 *
 * Aucun appel à un CDN externe (ni Google Fonts) : les fichiers sont servis
 * depuis le même domaine, ce qui supprime une requête tierce, évite tout
 * transfert d'adresse IP vers un tiers (point de vigilance RGPD) et garantit
 * que le site reste identique si le CDN tombe.
 *
 * `display: swap` : le texte s'affiche immédiatement dans la police de repli,
 * puis bascule — on ne bloque jamais le premier rendu.
 */
const sunMotter = localFont({
  src: '../../public/fonts/SunMotter.woff2',
  variable: '--font-sun-motter',
  display: 'swap',
  weight: '400',
  // Repli métrique approchant, pour limiter le décalage au moment du swap.
  fallback: ['Arial Black', 'Impact', 'sans-serif'],
  adjustFontFallback: false,
});

const manrope = localFont({
  src: [
    { path: '../../public/fonts/Manrope-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/Manrope-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Manrope-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/Manrope-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/Manrope-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-manrope',
  display: 'swap',
});

const reenieBeanie = localFont({
  src: '../../public/fonts/ReenieBeanie-Regular.woff2',
  variable: '--font-reenie',
  display: 'swap',
  weight: '400',
  fallback: ['Bradley Hand', 'cursive'],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${STUDIO.name} — Studio de coaching sportif à ${STUDIO.address.city}`,
    template: `%s — ${STUDIO.name}`,
  },
  description:
    `Coaching sportif en petit comité à ${STUDIO.address.city} : seul, à deux ou à trois, jamais plus. ` +
    'Douche et vestiaire sur place. Réservation en ligne en moins d’une minute.',
  applicationName: STUDIO.name,
  keywords: [
    'coach sportif Courbevoie',
    'studio de sport premium',
    'coaching individuel',
    'petit groupe',
    'préparation physique',
    'La Défense',
  ],
  authors: [{ name: STUDIO.legalName }],
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    siteName: STUDIO.name,
    title: `${STUDIO.name} — ${STUDIO.baseline}`,
    description:
      'Studio de coaching sportif en petit comité. Trois personnes maximum par séance. Réservez en ligne.',
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      { url: asset('/favicon.ico'), sizes: 'any' },
      { url: asset('/brand/icon-192.png'), type: 'image/png', sizes: '192x192' },
      { url: asset('/brand/icon-512.png'), type: 'image/png', sizes: '512x512' },
    ],
    apple: asset('/brand/apple-touch-icon.png'),
  },
  manifest: asset('/site.webmanifest'),
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Le zoom reste autorisé : le bloquer est un défaut d'accessibilité,
  // et le public du studio va de l'adolescent au senior.
  maximumScale: 5,
  themeColor: '#232323',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sunMotter.variable} ${manrope.variable} ${reenieBeanie.variable}`}>
      <body>
        <Navbar />
        <main id="contenu">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
