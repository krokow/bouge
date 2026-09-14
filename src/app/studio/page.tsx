import type { Metadata } from 'next';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset, OPENING_HOURS, STUDIO } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';

export const metadata: Metadata = {
  title: 'Le studio',
  description:
    `Un studio de coaching à ${STUDIO.address.city} : une seule pièce, un seul groupe à la fois, ` +
    'douche et vestiaire sur place. Visitez les lieux avant de venir.',
};

const SPACES = [
  {
    name: 'L’espace de coaching',
    image: 'studio-espace-coaching.webp',
    text:
      'Une grande pièce lumineuse, sol amortissant, plafond haut. Charges libres, kettlebells, élastiques, ' +
      'barre de traction, rameur. Pas de machines guidées alignées : on travaille debout, avec son corps.',
  },
  {
    name: 'Le vestiaire',
    image: 'studio-vestiaire.webp',
    text:
      'Casiers fermant à clé, bancs, miroir, sèche-cheveux. Assez de place pour se changer tranquillement ' +
      'sans jouer des coudes — vous êtes au maximum trois.',
  },
  {
    name: 'Les douches',
    image: 'studio-douches.webp',
    text:
      'Deux douches individuelles, serviettes propres fournies à chaque séance, gel douche et shampooing sur place. ' +
      'C’est ce qui permet de venir à 7h et d’être au bureau à 8h30.',
  },
  {
    name: 'L’accueil',
    image: 'studio-accueil.webp',
    text:
      'Un sas pour souffler avant et après. De l’eau, du café, de quoi s’asseoir cinq minutes ' +
      'sans être poussé dehors par le créneau suivant.',
  },
];

const RULES = [
  'Un seul groupe dans le studio à la fois. Vous ne croisez pas la séance précédente.',
  'Trois participants maximum, sans exception.',
  'Chaussures d’intérieur propres, changées sur place.',
  'Le matériel est désinfecté entre chaque séance.',
];

export default function StudioPage() {
  return (
    <>
      <PageHero
        eyebrow="Le lieu"
        title={<>Une pièce, un coach, personne d’autre.</>}
        intro={
          <>
            Le studio se trouve {STUDIO.address.street}, à {STUDIO.address.city}, à quelques minutes à pied de la
            gare. Ce n’est pas une salle de sport&nbsp;: c’est un espace privatisé pendant votre créneau.
          </>
        }
        mascotte="mascotte-walk-light.webp"
      />

      <section className="u-section bg-creme">
        <div className="u-container flex flex-col gap-[var(--spacing-fluid-5)]">
          {SPACES.map((space, i) => (
            <Reveal key={space.name}>
              <article
                className={`grid items-center gap-[var(--spacing-fluid-3)] lg:grid-cols-2 lg:gap-[var(--spacing-fluid-4)] ${
                  i % 2 === 1 ? 'lg:[&>figure]:order-2' : ''
                }`}
              >
                <figure className="m-0">
                  <img
                    src={asset(`/media/${space.image}`)}
                    alt={space.name}
                    width={1600}
                    height={1100}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="aspect-[16/11] w-full rounded-[1.75rem] object-cover"
                  />
                </figure>
                <div className="flex flex-col gap-3">
                  <span className="font-display text-[length:var(--text-2xl)] leading-none text-orange">
                    0{i + 1}
                  </span>
                  <h2 className="text-[length:var(--text-4xl)]">{space.name}</h2>
                  <p className="max-w-[50ch] text-[length:var(--text-lg)] leading-relaxed text-anthracite/75">
                    {space.text}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="u-section bg-anthracite text-creme">
        <div className="u-container grid gap-[var(--spacing-fluid-4)] lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <SectionHeading
              eyebrow="Les règles du lieu"
              tone="light"
              title="Quatre règles, c’est tout."
              className="[&_h2]:text-creme"
            />
            <ul className="flex flex-col gap-3.5">
              {RULES.map((rule, i) => (
                <Reveal as="li" key={rule} delay={i * 80}>
                  <span className="flex items-start gap-3.5 text-[length:var(--text-base)] text-creme/80">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-orange font-display text-xs leading-none text-creme">
                      {i + 1}
                    </span>
                    {rule}
                  </span>
                </Reveal>
              ))}
            </ul>
          </div>

          <Reveal delay={120}>
            <div className="flex h-full flex-col gap-6 rounded-[1.75rem] border border-creme/12 bg-creme/6 p-6 sm:p-8">
              <h3 className="text-[length:var(--text-2xl)]">Venir au studio</h3>

              <div className="flex flex-col gap-1">
                <p className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] text-creme/45">
                  Adresse
                </p>
                <p className="text-creme/85">
                  {STUDIO.address.street}
                  <br />
                  {STUDIO.address.postalCode} {STUDIO.address.city}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] text-creme/45">
                  Accès
                </p>
                <ul className="flex flex-col gap-1.5 text-[length:var(--text-sm)] text-creme/75">
                  {STUDIO.access.map((item) => (
                    <li key={item.label} className="flex flex-wrap justify-between gap-x-4">
                      <span>{item.label}</span>
                      <span className="text-creme/50">{item.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] text-creme/45">
                  Horaires
                </p>
                <ul className="flex flex-col gap-1.5 text-[length:var(--text-sm)] text-creme/75">
                  {OPENING_HOURS.map((row) => (
                    <li key={row.days} className="flex flex-wrap justify-between gap-x-4">
                      <span>{row.days}</span>
                      <span className="text-creme/50">{row.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ButtonLink href={BOOKING_HREF} size="md" block className="mt-auto">
                Réserver une séance <ArrowRight />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
