'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Bandeau cookies (RGPD / directive ePrivacy, recommandation CNIL 2020-092).
 *
 * Trois principes respectés :
 *  1. refuser est aussi simple qu'accepter — les deux boutons sont au même
 *     niveau visuel, aucun n'est grisé ni relégué ;
 *  2. aucun dépôt avant consentement — la mesure d'audience et les outils
 *     marketing ne sont chargés que si la catégorie correspondante est acceptée ;
 *  3. le choix est révocable à tout moment (lien « Gérer les cookies » du pied
 *     de page, qui rouvre ce panneau).
 *
 * INTÉGRATION : au moment de brancher un vrai outil de mesure, lire
 * `getConsent()` et ne charger le script que si `analytics === true`.
 */

const STORAGE_KEY = 'bouge.cookie-consent.v1';
/** Le consentement doit être redemandé au bout de 13 mois (doctrine CNIL). */
const CONSENT_MAX_AGE_DAYS = 395;

export interface CookieConsent {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    const age = (Date.now() - new Date(parsed.decidedAt).getTime()) / 86_400_000;
    return age > CONSENT_MAX_AGE_DAYS ? null : parsed;
  } catch {
    return null;
  }
}

function saveConsent(consent: Omit<CookieConsent, 'necessary' | 'decidedAt'>): void {
  const value: CookieConsent = { necessary: true, ...consent, decidedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Stockage refusé : le bandeau réapparaîtra à la prochaine visite.
  }
  window.dispatchEvent(new CustomEvent('bouge:consent', { detail: value }));
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [detailed, setDetailed] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  const open = useCallback((withDetails = false) => {
    const current = getConsent();
    setAnalytics(current?.analytics ?? false);
    setMarketing(current?.marketing ?? false);
    setDetailed(withDetails);
    setVisible(true);
  }, []);

  useEffect(() => {
    // Laisse le hero s'installer avant d'afficher le bandeau : le premier
    // écran garde son impact, le bandeau arrive juste après.
    if (!getConsent()) {
      const timer = window.setTimeout(() => setVisible(true), 1400);
      return () => window.clearTimeout(timer);
    }
  }, []);

  // Le lien « Gérer les cookies » du pied de page rouvre le panneau.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest('[data-cookie-settings]');
      if (target) {
        event.preventDefault();
        open(true);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  if (!visible) return null;

  const decide = (choice: { analytics: boolean; marketing: boolean }) => {
    saveConsent(choice);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        // `max-h` + défilement interne : sur un petit écran en paysage, le
        // bandeau ne peut jamais recouvrir toute la page.
        className="u-grain relative mx-auto flex max-h-[min(80svh,34rem)] max-w-4xl flex-col overflow-y-auto overscroll-contain rounded-3xl bg-anthracite text-creme shadow-[0_24px_70px_-20px_rgba(35,35,35,0.75)]"
        style={{ animation: 'u-fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <div className="relative flex flex-col gap-4 p-4 sm:gap-5 sm:p-7">
          <div className="flex flex-col gap-2">
            <h2 id="cookie-title" className="font-display text-[length:var(--text-xl)] leading-none sm:text-[length:var(--text-2xl)]">
              On parle cookies&nbsp;?
            </h2>
            {/* Volontairement court : le détail par catégorie est dans
                « Personnaliser », et l'intégralité dans la page dédiée. */}
            <p className="max-w-[62ch] text-[length:var(--text-xs)] leading-relaxed text-creme/72 sm:text-sm">
              Ceux qui font fonctionner le site (session, réservation en cours) ne demandent pas d’accord. Pour la
              mesure d’audience, c’est vous qui décidez, et vous pouvez changer d’avis à tout moment.{' '}
              <Link href="/confidentialite/" className="text-orange underline-offset-4 hover:underline">
                En savoir plus
              </Link>
              .
            </p>
          </div>

          {detailed && (
            <ul className="flex flex-col gap-2.5 rounded-2xl bg-creme/5 p-3.5 sm:p-4">
              <ConsentRow
                title="Strictement nécessaires"
                description="Session de connexion, panier de réservation, mémorisation de ce choix. Indispensables au fonctionnement du site."
                checked
                locked
              />
              <ConsentRow
                title="Mesure d’audience"
                description="Pages consultées et étapes du tunnel de réservation, en statistiques agrégées, pour repérer ce qui bloque."
                checked={analytics}
                onChange={setAnalytics}
              />
              <ConsentRow
                title="Marketing"
                description="Mesure de l’efficacité de nos publications et publicités. Aucun contenu publicitaire n’est affiché sur ce site."
                checked={marketing}
                onChange={setMarketing}
              />
            </ul>
          )}

          {/* Accepter et refuser sont côte à côte, de même taille et de même
              poids visuel : refuser n'est pas plus coûteux qu'accepter. */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
            <Button size="sm" onClick={() => decide({ analytics: true, marketing: true })} className="sm:flex-1">
              Tout accepter
            </Button>
            <Button
              size="sm"
              variant="cream"
              onClick={() => decide({ analytics: false, marketing: false })}
              className="sm:flex-1"
            >
              Tout refuser
            </Button>
            {detailed ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => decide({ analytics, marketing })}
                className="col-span-2 text-creme sm:flex-1"
              >
                Enregistrer mes choix
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDetailed(true)}
                className="col-span-2 text-creme/80 hover:bg-creme/10 sm:flex-1"
              >
                Personnaliser
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentRow({
  title,
  description,
  checked,
  locked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <li className="flex items-start gap-3.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={locked}
        onClick={() => onChange?.(!checked)}
        className={[
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
          checked ? 'bg-orange' : 'bg-creme/25',
          locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-creme transition-transform duration-300 ${
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
          }`}
        />
      </button>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-creme">{title}</p>
        <p className="text-xs leading-relaxed text-creme/60">{description}</p>
      </div>
    </li>
  );
}
