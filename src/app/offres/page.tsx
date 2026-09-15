import type { Metadata } from 'next';
import { OFFERS } from '@/data/offers';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { Marquee } from '@/components/ui/Marquee';
import { OfferShowcase } from '@/components/offers/OfferShowcase';
import { PageHero } from '@/components/ui/PageHero';
import { Price } from '@/components/ui/Price';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SCHEDULE, STUDIO } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';

export const metadata: Metadata = {
  title: 'Nos offres de coaching',
  description:
    'Séance découverte, coaching individuel, petit comité jusqu’à 3 personnes, formule mensuelle. ' +
    'Tarifs clairs, réservation en ligne, annulation libre jusqu’à 24 h avant.',
};

const FAQ = [
  {
    question: 'Je n’ai jamais fait de sport. C’est vraiment pour moi ?',
    answer:
      'Oui, et c’est même le cas le plus fréquent. La séance découverte existe pour ça : on évalue où vous en êtes ' +
      'sans jugement, on part de là. Personne ne vous regardera de travers, il n’y a personne d’autre dans la salle.',
  },
  {
    question: 'Je peux venir avec quelqu’un qui n’a pas le même niveau ?',
    answer:
      'C’est fréquent en petit comité : un conjoint sportif et l’autre débutant, un parent et son enfant. ' +
      'Melvin construit la séance avec deux intensités différentes sur les mêmes mouvements. Personne ne s’ennuie, ' +
      'personne ne se met en difficulté.',
  },
  {
    question: 'Que se passe-t-il si j’ai un empêchement ?',
    answer:
      `Vous annulez ou reportez en ligne, depuis votre espace, jusqu’à ${SCHEDULE.cancellationNoticeHours} h avant la séance. ` +
      `Au-delà, le créneau ne peut plus être proposé à quelqu’un d’autre : appelez le studio au ${STUDIO.phone}, ` +
      'on trouve une solution au cas par cas.',
  },
  {
    question: 'Faut-il apporter quelque chose ?',
    answer:
      'Une tenue et des chaussures propres. Le reste est sur place : serviettes, douche, vestiaire, produits d’hygiène. ' +
      'Vous pouvez venir avant le bureau et repartir habillé.',
  },
  {
    question: 'Le paiement en ligne est-il obligatoire ?',
    answer:
      'Non. Au moment de réserver, vous choisissez de payer en ligne par carte ou sur place le jour de la séance. ' +
      'Les deux options réservent le créneau de la même façon.',
  },
  {
    question: 'La formule mensuelle m’engage combien de temps ?',
    answer:
      'Un mois. Elle se reconduit tant que vous le souhaitez et s’arrête quand vous le décidez, sans préavis ni frais.',
  },
];

export default function OffresPage() {
  return (
    <>
      <PageHero
        eyebrow="Nos formules"
        title={<>Quatre formats. Une seule exigence.</>}
        intro={
          <>
            Toutes les séances durent une heure et se déroulent dans le même studio, avec le même coach. Ce qui
            change, c’est le nombre de personnes autour de vous et le rythme que vous voulez tenir.
          </>
        }
        mascotte="mascotte-lift-light.webp"
      >
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <ButtonLink href={BOOKING_HREF} size="md">
            Réserver maintenant <ArrowRight />
          </ButtonLink>
          <span className="text-[length:var(--text-sm)] text-creme/60">
            À partir de {Math.min(...OFFERS.map((o) => o.pricePerPersonCents)) / 100} € la séance, sans engagement.
          </span>
        </div>
      </PageHero>

      <OfferShowcase />

      <Marquee items={['Bougez.', 'Rencontrez.', 'Recommencez.', STUDIO.claim]} tone="anthracite" />

      {/* Tableau comparatif — se transforme en cartes empilées sous 768px */}
      <section className="u-section bg-creme">
        <div className="u-container">
          <SectionHeading
            eyebrow="Le tableau, pour les pressés"
            title="Tout, sur une seule ligne."
            intro="Si vous hésitez encore, commencez par la séance découverte. Elle n’engage à rien et elle répond à la question mieux que n’importe quel tableau."
          />

          <Reveal className="mt-[var(--spacing-fluid-4)]">
            {/* Version tableau, à partir de la tablette */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[46rem] border-collapse text-left">
                <caption className="sr-only">Comparaison des formules de coaching</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-48 pb-4 pr-4 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] text-anthracite/50">
                      Formule
                    </th>
                    {OFFERS.map((offer) => (
                      <th key={offer.id} scope="col" className="pb-4 pr-4 align-bottom">
                        <span className="block font-display text-[length:var(--text-xl)] leading-none">{offer.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[length:var(--text-sm)]">
                  <ComparisonRow
                    label="Participants"
                    values={OFFERS.map((o) =>
                      o.maxParticipants > 1 ? `${o.minParticipants} à ${o.maxParticipants}` : 'Seul',
                    )}
                  />
                  <ComparisonRow label="Durée" values={OFFERS.map((o) => `${o.durationMin} min`)} />
                  <ComparisonRow
                    label="Tarif"
                    values={OFFERS.map((o) => `${(o.pricePerPersonCents / 100).toFixed(0)} € ${o.priceUnit}`)}
                  />
                  <ComparisonRow
                    label="Séances incluses"
                    values={OFFERS.map((o) => (o.sessionsIncluded ? `${o.sessionsIncluded} par mois` : 'À l’unité'))}
                  />
                  <ComparisonRow label="Douche & vestiaire" values={OFFERS.map(() => 'Compris')} />
                  <ComparisonRow
                    label="Annulation en ligne"
                    values={OFFERS.map(() => `Jusqu’à ${SCHEDULE.cancellationNoticeHours} h avant`)}
                  />
                  <tr>
                    <th scope="row" className="py-4 pr-4 align-middle font-sans text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/50" />
                    {OFFERS.map((offer) => (
                      <td key={offer.id} className="py-4 pr-4">
                        <ButtonLink href={`${BOOKING_HREF}?offre=${offer.id}`} size="sm" variant="dark">
                          Réserver
                        </ButtonLink>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Version cartes empilées, sur mobile */}
            <ul className="flex flex-col gap-4 md:hidden">
              {OFFERS.map((offer) => (
                <li key={offer.id} className="u-card p-5">
                  <h3 className="mb-3 text-[length:var(--text-xl)]">{offer.name}</h3>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[length:var(--text-sm)]">
                    <dt className="text-anthracite/55">Participants</dt>
                    <dd className="text-right font-semibold">
                      {offer.maxParticipants > 1 ? `${offer.minParticipants} à ${offer.maxParticipants}` : 'Seul'}
                    </dd>
                    <dt className="text-anthracite/55">Durée</dt>
                    <dd className="text-right font-semibold">{offer.durationMin} min</dd>
                    <dt className="text-anthracite/55">Tarif</dt>
                    <dd className="text-right font-semibold">
                      <Price cents={offer.pricePerPersonCents} unit={offer.priceUnit} unitClassName="font-normal text-anthracite/55" />
                    </dd>
                    <dt className="text-anthracite/55">Séances</dt>
                    <dd className="text-right font-semibold">
                      {offer.sessionsIncluded ? `${offer.sessionsIncluded} par mois` : 'À l’unité'}
                    </dd>
                  </dl>
                  <ButtonLink href={`${BOOKING_HREF}?offre=${offer.id}`} size="sm" variant="dark" block className="mt-4">
                    Réserver <ArrowRight />
                  </ButtonLink>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="u-section bg-anthracite text-creme">
        <div className="u-container grid gap-[var(--spacing-fluid-4)] lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Questions fréquentes"
            tone="light"
            title="Ce qu’on nous demande le plus"
            className="[&_h2]:text-creme"
          />
          <ul className="flex flex-col gap-3">
            {FAQ.map((item, i) => (
              <Reveal as="li" key={item.question} delay={i * 70}>
                <details className="group rounded-2xl border border-creme/12 bg-creme/6 px-5 py-4 transition-colors duration-300 open:bg-creme/10">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-sans font-semibold tracking-tight marker:hidden [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="mt-1 grid size-6 shrink-0 place-items-center rounded-full border border-creme/30 transition-transform duration-300 group-open:rotate-45"
                    >
                      <svg viewBox="0 0 12 12" className="size-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M6 1.5v9M1.5 6h9" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 text-[length:var(--text-sm)] leading-relaxed text-creme/72">{item.answer}</p>
                </details>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function ComparisonRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <th
        scope="row"
        className="border-t border-anthracite/10 py-3.5 pr-4 align-middle font-sans text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.12em] text-anthracite/50"
      >
        {label}
      </th>
      {values.map((value, i) => (
        <td key={i} className="border-t border-anthracite/10 py-3.5 pr-4 align-middle text-anthracite/82">
          {value}
        </td>
      ))}
    </tr>
  );
}
