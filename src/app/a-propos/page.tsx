import type { Metadata } from 'next';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { ValuesBento } from '@/components/about/ValuesBento';
import { Reveal } from '@/components/ui/Reveal';
import { asset, STUDIO } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    `${STUDIO.coach.firstName}, coach diplômé STAPS, a ouvert ${STUDIO.name} à ${STUDIO.address.city} ` +
    'après plus de dix ans passés à enseigner le sport. Son histoire, sa méthode, ses valeurs.',
};

export default function AProposPage() {
  return (
    <>
      <PageHero
        eyebrow="À propos"
        title={<>Dix ans dans l’ombre, puis ce studio.</>}
        intro={
          <>
            Derrière {STUDIO.name}, il y a une personne, pas une enseigne&nbsp;: {STUDIO.coach.firstName}, coach
            diplômé STAPS, qui enseigne le sport depuis plus de {STUDIO.coach.years} ans.
          </>
        }
        mascotte="mascotte-run-light.webp"
      />

      <section className="u-section bg-creme">
        <div className="u-container grid items-start gap-[var(--spacing-fluid-4)] lg:grid-cols-[0.85fr_1.15fr]">
          <Reveal className="lg:sticky lg:top-28">
            <figure className="m-0 flex flex-col gap-3">
              <img
                src={asset('/media/melvin-portrait.webp')}
                alt={`${STUDIO.coach.fullName}, fondateur et coach du studio`}
                width={1600}
                height={1100}
                className="aspect-[4/5] w-full rounded-[1.75rem] object-cover"
              />
              <figcaption className="font-hand text-2xl text-anthracite/60">
                {STUDIO.coach.fullName}, {STUDIO.coach.role.toLowerCase()}.
              </figcaption>
            </figure>
          </Reveal>

          <div className="flex flex-col gap-5 text-[length:var(--text-lg)] leading-relaxed text-anthracite/80">
            <Reveal>
              <h2 className="mb-2 text-[length:var(--text-4xl)] text-anthracite">L’histoire</h2>
            </Reveal>
            <Reveal delay={60}>
              <p>
                {STUDIO.coach.firstName} a commencé par la natation. Il y a appris ce qui n’a plus jamais changé
                dans sa façon de coacher&nbsp;: on ne progresse pas en forçant, on progresse en répétant un geste
                juste, longtemps.
              </p>
            </Reveal>
            <Reveal delay={90}>
              <p>
                À dix-huit ans, il perd sa mère. Les études s’arrêtent là, mais pas l’envie de transmettre. Pendant
                plus de dix ans, il enseigne sans vitrine, sans site, sans enseigne&nbsp;: des cours particuliers,
                des petits groupes, du bouche-à-oreille. Une clientèle se construit, fidèle, avant même que
                l’activité n’ait un nom.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p>
                À trente ans, il reprend les cours et décroche son diplôme STAPS. Pas pour la ligne sur le
                curriculum&nbsp;: pour pouvoir enseigner librement, en règle, et pour donner à ce qu’il faisait
                déjà le cadre que ça méritait.
              </p>
            </Reveal>
            <Reveal delay={150}>
              <p className="border-l-2 border-orange pl-5 font-hand text-[length:var(--text-2xl)] leading-snug text-anthracite">
                « Le sport doit faire partie du quotidien. Pas être une punition qu’on s’inflige en janvier. »
              </p>
            </Reveal>
            <Reveal delay={180}>
              <p>
                {STUDIO.name} est né de là. Un lieu à lui, à {STUDIO.address.city}, où l’on travaille sérieusement
                sans se sentir dans une usine. Trois personnes au maximum, une douche pour repartir propre, et
                quelqu’un qui se souvient de ce que vous avez fait la semaine dernière.
              </p>
            </Reveal>

            <Reveal delay={60} className="pt-6">
              <h2 className="mb-2 text-[length:var(--text-4xl)] text-anthracite">La méthode</h2>
            </Reveal>
            <Reveal delay={90}>
              <p>
                Pas de programme type. La première séance sert à regarder comment vous bougez&nbsp;: mobilité des
                hanches, des épaules, gainage, souffle. Ensuite seulement on construit, et on ajuste à chaque
                séance en fonction de ce que votre corps dit ce jour-là.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p>
                {STUDIO.coach.firstName} ne promet pas de transformation en douze semaines. Il promet des séances
                qu’on a envie de refaire, parce que c’est la seule chose qui produit un résultat au bout de deux
                ans.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <ValuesBento />

      <section className="u-section bg-orange text-creme">
        <div className="u-container flex flex-col items-center gap-6 text-center">
          <h2 className="max-w-[18ch] text-[length:var(--text-5xl)]">Le mieux, c’est encore de venir voir.</h2>
          <p className="max-w-[48ch] text-creme/85">
            Une séance découverte, une heure, sans engagement. Vous saurez très vite si le lieu et la méthode vous
            correspondent.
          </p>
          <ButtonLink href={BOOKING_HREF} variant="cream" size="lg">
            Réserver ma séance découverte <ArrowRight />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
