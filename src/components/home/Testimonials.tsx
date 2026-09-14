import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset } from '@/lib/config';

/**
 * Témoignages — contenu de démonstration.
 * ⚠️ À remplacer par de vrais avis clients avant la mise en ligne : publier des
 * témoignages inventés comme s'ils étaient réels est une pratique commerciale
 * trompeuse (art. L121-2 du code de la consommation).
 */
const TESTIMONIALS = [
  {
    quote:
      'Je n’avais pas fait de sport depuis huit ans et j’avais surtout peur d’avoir l’air ridicule. On a commencé par apprendre à respirer. Six mois après, je viens deux fois par semaine.',
    name: 'Camille',
    detail: '32 ans · Petit comité',
    color: 'bg-orange',
  },
  {
    quote:
      'J’étais en salle classique depuis trois ans sans progresser. Ici quelqu’un regarde ce que je fais et me reprend. J’ai pris plus en quatre mois qu’en trois ans.',
    name: 'Thomas',
    detail: '27 ans · Coaching individuel',
    color: 'bg-jade',
  },
  {
    quote:
      'Ce qui m’a décidée, c’est qu’on ne m’a pas parlé comme à une dame de cinquante ans. On m’a parlé comme à quelqu’un qui veut avoir un dos solide à soixante-dix.',
    name: 'Sylvie',
    detail: '52 ans · Formule mensuelle',
    color: 'bg-ciel',
  },
];

export function Testimonials() {
  return (
    <section className="u-section relative overflow-hidden bg-anthracite text-creme">
      <img
        src={asset('/brand/sticker-motivation-orange.webp')}
        alt=""
        width={640}
        height={322}
        loading="lazy"
        className="u-float pointer-events-none absolute right-[5vw] top-10 hidden h-20 w-auto opacity-80 xl:block"
        style={{ ['--float-rot' as string]: '4deg' }}
      />

      <div className="u-container relative">
        <SectionHeading
          eyebrow="Ils viennent déjà"
          tone="light"
          title="On ne vous promet pas un corps. On vous promet de revenir."
          className="[&_h2]:max-w-[22ch] [&_h2]:text-creme"
        />

        <ul className="mt-[var(--spacing-fluid-5)] grid gap-5 md:grid-cols-3 lg:gap-6">
          {TESTIMONIALS.map((item, i) => (
            <Reveal as="li" key={item.name} delay={i * 120}>
              <figure className="flex h-full flex-col gap-5 rounded-[1.75rem] border border-creme/12 bg-creme/6 p-6 sm:p-7">
                <svg viewBox="0 0 32 24" aria-hidden="true" className="h-7 w-auto fill-orange">
                  <path d="M0 24V13.5C0 6 4.5 1 12 0l1.5 4C9 5.5 7 8 7 11h5v13H0Zm18 0V13.5C18 6 22.5 1 30 0l1.5 4C27 5.5 25 8 25 11h5v13H18Z" />
                </svg>
                <blockquote className="text-[length:var(--text-base)] leading-relaxed text-creme/85">
                  {item.quote}
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 pt-2">
                  <span
                    aria-hidden="true"
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${item.color} font-display text-lg leading-none text-creme`}
                  >
                    {item.name[0]}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold leading-tight">{item.name}</span>
                    <span className="text-[length:var(--text-xs)] text-creme/55">{item.detail}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
