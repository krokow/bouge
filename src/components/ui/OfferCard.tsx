import Link from 'next/link';
import { ArrowRight, ButtonLink } from './Button';
import { COLOR_CLASSES } from '@/lib/colors';
import { Price } from './Price';
import { BOOKING_HREF } from '@/lib/nav';
import type { Offer } from '@/lib/types';

/**
 * Carte d'offre, partagée par la page d'accueil et la page « Nos offres ».
 * `detailed` ajoute la description longue et le public visé.
 */
export function OfferCard({ offer, detailed = false }: { offer: Offer; detailed?: boolean }) {
  const c = COLOR_CLASSES[offer.color];

  return (
    <article
      className={[
        // `text-anthracite` est explicite : la carte est réutilisée sur fond
        // sombre (page d'accueil), où elle hériterait sinon du texte crème.
        'group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border-2 bg-blanc p-6 text-anthracite sm:p-7',
        'transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(35,35,35,0.4)]',
        offer.featured ? `${c.border} shadow-[0_20px_50px_-30px_rgba(35,35,35,0.45)]` : 'border-anthracite/10 hover:border-anthracite/25',
      ].join(' ')}
    >
      {/* Halo de couleur qui se révèle au survol */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br ${c.gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
      />

      <div className="relative flex flex-col gap-1.5">
        {/* Le badge est dans le flux, jamais en absolu : il ne peut donc pas
            recouvrir le titre quand celui-ci passe sur deux lignes. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`flex items-center gap-2 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.18em] ${c.text}`}>
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${c.dot}`} />
            {offer.durationMin} min
            {offer.maxParticipants > 1 ? ` · ${offer.minParticipants} à ${offer.maxParticipants} pers.` : ' · en solo'}
          </span>
          {offer.featured && (
            <span className={`rounded-full px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] ${c.solid}`}>
              Le plus choisi
            </span>
          )}
        </div>
        <h3 className="text-[length:var(--text-2xl)] leading-none">{offer.name}</h3>
        <p className="font-hand text-xl text-anthracite/65">{offer.tagline}</p>
      </div>

      <p className="relative mt-5 text-[length:var(--text-4xl)]">
        <Price
          cents={offer.pricePerPersonCents}
          unit={offer.priceUnit}
          unitClassName="text-[length:var(--text-sm)] text-anthracite/55"
        />
      </p>

      {detailed && (
        <>
          <p className="relative mt-4 text-[length:var(--text-sm)] leading-relaxed text-anthracite/72">{offer.description}</p>
          <p className={`relative mt-4 rounded-2xl px-4 py-3 text-[length:var(--text-sm)] leading-relaxed ${c.soft}`}>
            <span className="font-semibold">Pour qui&nbsp;: </span>
            {offer.audience}
          </p>
        </>
      )}

      <ul className="relative mt-5 flex flex-col gap-2.5 text-[length:var(--text-sm)]">
        {offer.highlights.map((point) => (
          <li key={point} className="flex items-start gap-2.5 text-anthracite/78">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`mt-[0.35em] size-3.5 shrink-0 ${c.text}`}
            >
              <path d="M4 10.5l4 4 8-9" />
            </svg>
            {point}
          </li>
        ))}
      </ul>

      <div className="relative mt-auto pt-7">
        <ButtonLink
          href={`${BOOKING_HREF}?offre=${offer.id}`}
          block
          size="md"
          variant={offer.featured ? 'primary' : 'dark'}
        >
          Réserver <ArrowRight />
        </ButtonLink>
        {!detailed && (
          <Link
            href="/offres/"
            className="mt-3 block text-center text-[length:var(--text-sm)] text-anthracite/55 no-underline transition-colors hover:text-orange"
          >
            En savoir plus
          </Link>
        )}
      </div>
    </article>
  );
}
