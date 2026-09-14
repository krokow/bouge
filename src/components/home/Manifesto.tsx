import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset, MAX_PARTICIPANTS, STUDIO } from '@/lib/config';

const PILLARS = [
  {
    title: 'Trois, jamais quatre',
    body:
      'Au-delà de trois personnes, on ne peut plus corriger tout le monde. C’est la limite physique du métier, ' +
      'pas une astuce commerciale. Alors on ne la dépasse pas, même quand la demande est là.',
    image: 'mascotte-lift-dark.webp',
  },
  {
    title: 'Un coach, pas un abonnement',
    body:
      `${STUDIO.coach.firstName} connaît votre genou fragile, votre semaine chargée et la raison pour laquelle ` +
      'vous avez arrêté la dernière fois. Vous ne recommencez jamais à zéro à chaque séance.',
    image: 'mascotte-walk-dark.webp',
  },
  {
    title: 'On vient, on repart propre',
    body:
      'Douche, vestiaire, serviettes. Vous pouvez venir avant le bureau et repartir présentable — ' +
      'c’est souvent ce détail qui fait qu’une habitude tient ou non.',
    image: 'mascotte-run-dark.webp',
  },
];

export function Manifesto() {
  return (
    <section className="u-section relative overflow-hidden bg-creme">
      {/* Tampon de marque en filigrane */}
      <img
        src={asset('/brand/badge-orange.webp')}
        alt=""
        width={640}
        height={640}
        loading="lazy"
        className="u-spin-slow pointer-events-none absolute -right-16 top-12 hidden size-56 opacity-[0.07] lg:block"
      />

      <div className="u-container">
        <SectionHeading
          eyebrow="Ce qui change ici"
          title={
            <>
              Une salle de sport,
              <br />
              <span className="u-mark">ça n’est pas ça.</span>
            </>
          }
          intro={
            <>
              Vous êtes déjà allé dans une grande enseigne. Vous savez ce que ça donne&nbsp;: une carte, un badge,
              et personne pour vous dire que votre dos est en train de s’arrondir. Ici, il y a{' '}
              {MAX_PARTICIPANTS} personnes maximum dans la pièce, et quelqu’un qui regarde.
            </>
          }
        />

        <ul className="mt-[var(--spacing-fluid-5)] grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {PILLARS.map((pillar, i) => (
            <Reveal as="li" key={pillar.title} delay={i * 110}>
              <article className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-[1.75rem] border-2 border-anthracite/10 bg-blanc p-6 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-anthracite/25 hover:shadow-[0_30px_60px_-32px_rgba(35,35,35,0.42)] sm:p-7">
                <span className="font-display text-[length:var(--text-3xl)] leading-none text-orange">
                  0{i + 1}
                </span>
                <h3 className="text-[length:var(--text-2xl)] leading-none">{pillar.title}</h3>
                <p className="text-[length:var(--text-base)] leading-relaxed text-anthracite/72">{pillar.body}</p>
                <img
                  src={asset(`/brand/${pillar.image}`)}
                  alt=""
                  width={760}
                  height={760}
                  loading="lazy"
                  className="mt-auto h-28 w-auto self-end opacity-85 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1.5 group-hover:scale-105 sm:h-32"
                />
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
