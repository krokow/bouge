import Link from 'next/link';
import { asset, INSTAGRAM_HANDLE, INSTAGRAM_URL, OPENING_HOURS, SOCIAL, STUDIO } from '@/lib/config';
import { BOOKING_HREF, LEGAL_NAV, MAIN_NAV } from '@/lib/nav';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { InstagramIcon } from '@/components/ui/InstagramIcon';

export function Footer() {
  return (
    <footer className="u-grain relative overflow-hidden bg-anthracite text-creme">
      {/* Bandeau d'appel à l'action, dernier rappel avant le pied de page */}
      <div className="relative border-b border-creme/10">
        <div className="u-container flex flex-col items-center gap-8 py-[var(--spacing-fluid-5)] text-center">
          <img
            src={asset('/brand/mascotte-run-light.webp')}
            alt=""
            width={760}
            height={640}
            loading="lazy"
            className="u-float h-24 w-auto opacity-90 sm:h-32"
            style={{ ['--float-rot' as string]: '-3deg' }}
          />
          <h2 className="max-w-[16ch] text-[length:var(--text-5xl)]">
            On commence quand&nbsp;?
          </h2>
          <p className="max-w-[46ch] text-balance text-creme/70">
            Première séance sans engagement. Vous repartez avec un plan, même si vous n’allez pas plus loin.
          </p>
          <ButtonLink href={BOOKING_HREF} size="lg">
            Prendre rendez-vous <ArrowRight />
          </ButtonLink>
        </div>
      </div>

      <div className="u-container relative grid gap-[var(--spacing-fluid-4)] py-[var(--spacing-fluid-5)] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div className="flex flex-col gap-5">
          <img
            src={asset('/brand/logo-baseline-creme.webp')}
            alt={`${STUDIO.name} — ${STUDIO.baseline}`}
            width={900}
            height={300}
            loading="lazy"
            className="h-16 w-auto"
          />
          <p className="max-w-[34ch] text-sm leading-relaxed text-creme/65">
            Studio de coaching sportif en petit comité à {STUDIO.address.city}. Douche et vestiaire sur place.
            Trois personnes maximum par séance, jamais plus.
          </p>
          <p className="font-hand text-2xl text-orange">{STUDIO.slogan}</p>
        </div>

        <nav aria-label="Pages du site">
          <h3 className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.18em] text-creme/45">Le studio</h3>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link href="/" className="text-creme/75 no-underline transition-colors hover:text-orange">
                Accueil
              </Link>
            </li>
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-creme/75 no-underline transition-colors hover:text-orange">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={BOOKING_HREF} className="text-creme/75 no-underline transition-colors hover:text-orange">
                Réserver
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h3 className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.18em] text-creme/45">Horaires</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-creme/75">
            {OPENING_HOURS.map((row) => (
              <li key={row.days} className="flex flex-col">
                <span className="text-creme">{row.days}</span>
                <span className="text-creme/60">{row.hours}</span>
              </li>
            ))}
          </ul>
        </div>

        <address className="not-italic">
          <h3 className="mb-4 font-sans text-xs font-bold uppercase tracking-[0.18em] text-creme/45">Nous trouver</h3>
          <ul className="flex flex-col gap-2.5 text-sm text-creme/75">
            <li>
              {STUDIO.address.street}
              <br />
              {STUDIO.address.postalCode} {STUDIO.address.city}
            </li>
            <li>
              <a href={`tel:${STUDIO.phoneHref}`} className="text-creme no-underline transition-colors hover:text-orange">
                {STUDIO.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${STUDIO.email}`} className="text-creme no-underline transition-colors hover:text-orange">
                {STUDIO.email}
              </a>
            </li>
            <li className="pt-1">
              {/* Lien simple, pas de widget : aucune requête vers Instagram tant
                  que le visiteur ne clique pas, donc aucun traceur tiers. */}
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-creme/75 no-underline transition-colors hover:text-orange"
              >
                <InstagramIcon />
                <span>{INSTAGRAM_HANDLE}</span>
                <span className="text-creme/45">+{SOCIAL.instagram.followersLabel} abonnés</span>
              </a>
            </li>
          </ul>
        </address>
      </div>

      <div className="relative border-t border-creme/10">
        <div className="u-container flex flex-col items-center justify-between gap-4 py-6 text-center text-xs text-creme/50 md:flex-row md:text-left">
          <p>
            © {STUDIO.since} {STUDIO.legalName} — Tous droits réservés. Identité visuelle&nbsp;: Call me Claro.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-creme/55 no-underline transition-colors hover:text-orange">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                data-cookie-settings
                className="text-creme/55 underline-offset-4 transition-colors hover:text-orange hover:underline"
              >
                Gérer les cookies
              </button>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
