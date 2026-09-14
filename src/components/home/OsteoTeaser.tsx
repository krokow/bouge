import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/SectionHeading';
import { asset } from '@/lib/config';

/**
 * Teaser du futur cabinet d'ostéopathie.
 * Aucun lien de réservation : le service n'est pas encore ouvert, on ne propose
 * donc que de laisser son email pour être prévenu.
 */
export function OsteoTeaser() {
  return (
    <section className="u-section bg-creme">
      <div className="u-container">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border-2 border-anthracite/12 bg-blanc">
            <div className="grid items-stretch lg:grid-cols-[1.15fr_1fr]">
              <div className="flex flex-col gap-5 p-7 sm:p-9 lg:p-12">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-ciel/18 px-3.5 py-1.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] text-anthracite">
                  <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-ciel" />
                  Bientôt disponible
                </span>

                <Eyebrow className="text-ciel">Le deuxième métier du lieu</Eyebrow>

                <h2 className="max-w-[16ch] text-[length:var(--text-4xl)]">
                  Un ostéopathe,
                  <br />
                  dans les mêmes murs.
                </h2>

                <p className="max-w-[54ch] text-[length:var(--text-base)] leading-relaxed text-anthracite/72">
                  Un cabinet indépendant et sa salle d’attente ouvriront au studio. L’idée est simple&nbsp;: quand
                  une douleur revient toujours au même endroit, il faut quelqu’un pour la regarder — et ce
                  quelqu’un doit parler avec votre coach, pas travailler dans son coin.
                </p>

                <ul className="flex flex-col gap-2.5 text-[length:var(--text-sm)] text-anthracite/78">
                  {[
                    'Cabinet dédié et salle d’attente séparée de l’espace de coaching',
                    'Échange direct entre l’ostéopathe et votre coach, avec votre accord',
                    'Créneaux dédiés, indépendants du planning des séances',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span aria-hidden="true" className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-ciel" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex flex-wrap gap-3">
                  <ButtonLink href="/osteopathie/" variant="dark" size="md">
                    En savoir plus <ArrowRight />
                  </ButtonLink>
                </div>

                <p className="font-hand text-xl text-anthracite/55">
                  La réservation en ligne ouvrira en même temps que le cabinet.
                </p>
              </div>

              <div className="relative min-h-56 overflow-hidden lg:min-h-full">
                <img
                  src={asset('/media/osteo-cabinet.webp')}
                  alt="Le futur cabinet d’ostéopathie"
                  width={1600}
                  height={1100}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
                {/* Voile pour signaler que le service n'est pas encore ouvert */}
                <div className="absolute inset-0 bg-anthracite/25" />
                <span className="absolute bottom-5 left-5 rounded-full bg-anthracite/85 px-4 py-2 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] text-creme backdrop-blur-sm">
                  Ouverture prévue en {new Date().getFullYear() + 1}
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
