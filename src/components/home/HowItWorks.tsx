import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';

const STEPS = [
  {
    title: 'Vous choisissez',
    body: 'Le nombre de participants, la formule, la date, l’horaire. Quatre écrans, pas un de plus.',
  },
  {
    title: 'Vous confirmez',
    body: 'Compte créé en trente secondes. Paiement en ligne ou sur place, comme vous préférez.',
  },
  {
    title: 'Vous venez',
    body: 'Confirmation par email, rappel la veille. Tenue, serviette : le reste est sur place.',
  },
];

export function HowItWorks() {
  return (
    <section className="u-section relative overflow-hidden bg-jade text-creme">
      <img
        src={asset('/brand/mascotte-run-light.webp')}
        alt=""
        width={760}
        height={640}
        loading="lazy"
        className="pointer-events-none absolute -bottom-6 right-[3vw] hidden h-64 w-auto opacity-25 lg:block"
      />

      <div className="u-container relative">
        <SectionHeading
          eyebrow="La réservation"
          tone="light"
          align="center"
          title="Réserver prend une minute."
          intro="Pas de formulaire de contact, pas d’attente d’un rappel. Vous voyez les créneaux réellement libres et vous prenez le vôtre."
          className="mx-auto [&_h2]:max-w-[20ch] [&_h2]:text-creme [&_p]:text-creme/75"
        />

        <ol className="mt-[var(--spacing-fluid-5)] grid gap-5 md:grid-cols-3 lg:gap-8">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 130}>
              <div className="relative flex h-full flex-col gap-3 rounded-[1.75rem] bg-creme/10 p-6 backdrop-blur-sm sm:p-7">
                <span className="grid size-12 place-items-center rounded-full bg-creme font-display text-2xl leading-none text-jade">
                  {i + 1}
                </span>
                <h3 className="text-[length:var(--text-2xl)] leading-none">{step.title}</h3>
                <p className="text-[length:var(--text-base)] leading-relaxed text-creme/78">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={160} className="mt-10 flex justify-center">
          <ButtonLink href={BOOKING_HREF} variant="cream" size="lg">
            Voir les créneaux disponibles <ArrowRight />
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
