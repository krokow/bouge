'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { asset, STUDIO } from '@/lib/config';
import { useCurrentUser, useMounted } from '@/lib/hooks/useDatabase';
import { BOOKING_HREF, MAIN_NAV, workspaceFor } from '@/lib/nav';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';

/**
 * Navigation principale.
 *
 * Deux états :
 *  - « overlay » : transparente, posée sur la vidéo du hero (page d'accueil en
 *    haut de page) ;
 *  - « solide » : fond anthracite dès que l'on défile ou sur les autres pages.
 *
 * Sous 1024px la navigation bascule dans un panneau latéral, mais le bouton
 * « Réserver » reste toujours visible dans la barre : c'est l'action principale
 * du site, elle ne doit jamais être cachée derrière un menu.
 */
export function Navbar() {
  const pathname = usePathname() ?? '/';
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const mounted = useMounted();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Referme le panneau à chaque changement de page.
  useEffect(() => setOpen(false), [pathname]);

  // Bloque le défilement de la page quand le panneau mobile est ouvert.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Fermeture au clavier.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const solid = !isHome || scrolled;
  const { href: accountHref, label: accountLabel } = workspaceFor(user?.role);

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-orange focus:px-5 focus:py-3 focus:text-creme"
      >
        Aller au contenu
      </a>

      <header
        className={[
          'fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,box-shadow,padding] duration-500',
          solid
            ? 'bg-anthracite/92 py-2.5 shadow-[0_1px_0_0_rgba(255,251,232,0.10)] backdrop-blur-xl sm:py-3'
            : 'bg-transparent py-3 sm:py-5',
        ].join(' ')}
      >
        <nav className="u-container-wide flex items-center justify-between gap-3" aria-label="Navigation principale">
          <Link href="/" className="shrink-0" aria-label={`${STUDIO.name} — accueil`}>
            <img
              src={asset('/brand/wordmark-creme.webp')}
              alt={STUDIO.name}
              width={720}
              height={183}
              className={`w-auto transition-all duration-500 ${solid ? 'h-7 sm:h-8' : 'h-8 sm:h-10'}`}
            />
          </Link>

          {/* Liens — visibles à partir du laptop */}
          <ul className="hidden items-center gap-1 lg:flex">
            {MAIN_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      'relative rounded-full px-3.5 py-2 text-sm font-medium tracking-tight transition-colors duration-300 xl:px-4',
                      active ? 'text-orange' : 'text-creme/78 hover:text-creme',
                    ].join(' ')}
                  >
                    {item.label}
                    {item.soon && (
                      <span className="ml-1.5 align-middle text-[0.6rem] font-bold uppercase tracking-widest text-jade">
                        bientôt
                      </span>
                    )}
                    <span
                      className={[
                        'absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left rounded-full bg-orange transition-transform duration-300',
                        active ? 'scale-x-100' : 'scale-x-0',
                      ].join(' ')}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={accountHref}
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-creme/78 transition-colors hover:text-creme md:inline-flex"
            >
              {mounted ? accountLabel : 'Se connecter'}
            </Link>

            {/* Toujours visible, à toutes les tailles d'écran. */}
            <ButtonLink href={BOOKING_HREF} size="sm" className="px-4 sm:px-5">
              <span className="hidden sm:inline">Prendre rendez-vous</span>
              <span className="sm:hidden">Réserver</span>
              <ArrowRight />
            </ButtonLink>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-creme/25 text-creme transition-colors hover:bg-creme/10 lg:hidden"
            >
              <span className="relative block h-3.5 w-5">
                <span
                  className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-all duration-300 ${
                    open ? 'top-1.5 rotate-45' : 'top-0'
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 block h-[2px] w-full rounded-full bg-current transition-all duration-300 ${
                    open ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-all duration-300 ${
                    open ? 'top-1.5 -rotate-45' : 'top-3'
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* Panneau mobile / tablette.
          Empilement : voile (55) puis panneau (60) passent AU-DESSUS de la
          barre de navigation (50). Sans cela, le bouton de fermeture du
          panneau se retrouve sous le bouton burger, qui capte le clic. */}
      <div
        className={`fixed inset-0 z-[55] bg-anthracite/70 backdrop-blur-sm transition-opacity duration-400 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        id="menu-mobile"
        className={[
          'fixed right-0 top-0 flex h-[100dvh] w-[min(22rem,88vw)] flex-col overflow-y-auto',
          'bg-anthracite text-creme transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ zIndex: 60 }}
        // Panneau fermé : ses liens sortent de l'ordre de tabulation.
        inert={!open}
      >
        <div className="flex items-center justify-between px-6 pb-6 pt-6">
          <img src={asset('/brand/wordmark-creme.webp')} alt="" width={720} height={183} className="h-7 w-auto" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="grid size-11 place-items-center rounded-full border border-creme/25 text-creme"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col gap-1 px-4">
          {MAIN_NAV.map((item, i) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-2xl px-4 py-4 font-display text-2xl leading-none transition-colors hover:bg-creme/8"
                style={{
                  transitionDelay: open ? `${80 + i * 45}ms` : '0ms',
                  opacity: open ? 1 : 0,
                  transform: open ? 'none' : 'translateY(12px)',
                  transitionProperty: 'opacity, transform, background-color',
                  transitionDuration: '450ms',
                }}
              >
                {item.label}
                {item.soon && (
                  <span className="rounded-full bg-jade/20 px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-widest text-jade">
                    bientôt
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-3 px-6 pb-8 pt-8">
          <ButtonLink href={BOOKING_HREF} block size="md">
            Prendre rendez-vous <ArrowRight />
          </ButtonLink>
          <ButtonLink href={accountHref} block size="md" variant="outline" className="text-creme">
            {mounted ? accountLabel : 'Se connecter'}
          </ButtonLink>
          <a href={`tel:${STUDIO.phoneHref}`} className="pt-3 text-center text-sm text-creme/60 no-underline">
            {STUDIO.phone}
          </a>
        </div>
      </div>
    </>
  );
}
