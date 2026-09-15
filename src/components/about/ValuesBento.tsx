import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset, STUDIO } from '@/lib/config';

/**
 * Les cinq valeurs de marque, en composition asymétrique.
 *
 * Les valeurs sont reprises telles quelles des Brand Guidelines (p.5). La mise
 * en page les hiérarchise au lieu de les aligner : le savoir-faire — le seul
 * argument chiffrable — occupe la grande tuile, le partage ferme la section sur
 * toute la largeur avec la signature de la marque.
 *
 * Grille de 12 colonnes à partir du laptop, empilement simple en dessous.
 * Chaque tuile porte une couleur différente de la palette : la section est
 * lisible d'un coup d'œil sans qu'aucune valeur ne se ressemble.
 */
export function ValuesBento() {
  return (
    <section className="u-section bg-anthracite text-creme">
      <div className="u-container">
        <SectionHeading
          eyebrow="Nos valeurs"
          tone="light"
          title="Cinq mots qui tiennent le lieu"
          intro="Ils ne sont pas accrochés au mur pour faire joli. Ils décident de choses concrètes : du nombre de personnes dans la pièce, du ton employé, de ce qu’on refuse de vendre."
          className="[&_h2]:text-creme [&_p]:text-creme/70"
        />

        <ul className="mt-[var(--spacing-fluid-5)] grid gap-3 sm:gap-4 lg:grid-cols-12 lg:auto-rows-[minmax(10rem,auto)]">
          {/* 01 — Savoir-faire : grande tuile, la seule valeur qui se chiffre */}
          <Reveal as="li" className="lg:col-span-5 lg:row-span-2">
            <article className="u-grain relative flex h-full flex-col justify-between overflow-hidden rounded-[1.75rem] bg-orange p-6 text-creme sm:p-8">
              <img
                src={asset('/brand/mascotte-lift-light.webp')}
                alt=""
                width={760}
                height={741}
                loading="lazy"
                className="pointer-events-none absolute -bottom-4 -right-6 h-44 w-auto opacity-25 sm:h-56"
              />
              <div className="relative flex flex-col gap-3">
                <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.2em] opacity-70">01</span>
                <h3 className="text-[length:var(--text-5xl)]">Savoir-faire</h3>
                <p className="max-w-[32ch] text-[length:var(--text-base)] leading-relaxed opacity-90">
                  Un coaching légitimé par un vrai diplôme et {STUDIO.coach.years} ans de terrain. Ce n’est pas
                  une reconversion&nbsp;: c’est un métier appris, exercé, puis officialisé.
                </p>
              </div>
              <div className="relative mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-creme/25 pt-5">
                <p className="flex flex-col">
                  <span className="font-display text-[length:var(--text-4xl)] leading-none">STAPS</span>
                  <span className="text-[length:var(--text-xs)] opacity-75">diplôme universitaire</span>
                </p>
                <p className="flex flex-col">
                  <span className="font-display text-[length:var(--text-4xl)] leading-none">{STUDIO.coach.years}+</span>
                  <span className="text-[length:var(--text-xs)] opacity-75">années d’enseignement</span>
                </p>
              </div>
            </article>
          </Reveal>

          {/* 02 — Bienveillance : tuile claire, pour contraster */}
          <Reveal as="li" delay={90} className="lg:col-span-7">
            <article className="flex h-full flex-col gap-3 rounded-[1.75rem] bg-creme p-6 text-anthracite sm:p-8">
              <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.2em] text-anthracite/40">02</span>
              <h3 className="text-[length:var(--text-4xl)]">Bienveillance</h3>
              <p className="max-w-[48ch] text-[length:var(--text-base)] leading-relaxed text-anthracite/75">
                Une attention sincère portée à chacun, dans l’accompagnement comme dans l’accueil. Personne ne
                repart d’ici en ayant eu le sentiment d’être jugé sur son niveau, son âge ou sa forme du jour.
              </p>
            </article>
          </Reveal>

          {/* 03 — Longévité */}
          <Reveal as="li" delay={150} className="lg:col-span-4">
            <article className="flex h-full flex-col gap-3 rounded-[1.75rem] bg-jade p-6 text-creme sm:p-7">
              <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.2em] opacity-70">03</span>
              <h3 className="text-[length:var(--text-3xl)]">Longévité</h3>
              <p className="text-[length:var(--text-sm)] leading-relaxed opacity-90">
                Une vision inscrite dans la durée, pour votre santé comme pour le projet. On construit un dos
                solide à soixante-dix ans, pas un résultat pour l’été.
              </p>
            </article>
          </Reveal>

          {/* 04 — Équilibre */}
          <Reveal as="li" delay={210} className="lg:col-span-3">
            <article className="flex h-full flex-col gap-3 rounded-[1.75rem] bg-ciel p-6 text-anthracite sm:p-7">
              <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.2em] text-anthracite/45">04</span>
              <h3 className="text-[length:var(--text-3xl)]">Équilibre</h3>
              <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/80">
                Le sport comme art de vivre&nbsp;: entre performance, détente et bien-être. Jamais l’un au prix
                des deux autres.
              </p>
            </article>
          </Reveal>

          {/* 05 — Partage : bande pleine largeur, avec la signature de la marque */}
          <Reveal as="li" delay={270} className="lg:col-span-12">
            <article className="u-grain relative flex flex-col items-start gap-5 overflow-hidden rounded-[1.75rem] bg-brun p-6 text-creme sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              <div className="relative flex flex-col gap-3">
                <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.2em] opacity-70">05</span>
                <h3 className="text-[length:var(--text-4xl)]">Partage &amp; transmission</h3>
                <p className="max-w-[56ch] text-[length:var(--text-base)] leading-relaxed opacity-90">
                  L’envie de faire découvrir le goût du sport et de fédérer une communauté. C’est pour ça qu’il y a
                  un comptoir dans la salle d’attente&nbsp;: pour que les gens se croisent au lieu de se succéder.
                </p>
              </div>
              <img
                src={asset('/brand/sticker-motivation-orange.webp')}
                alt={STUDIO.slogan}
                width={640}
                height={322}
                loading="lazy"
                className="u-float relative h-20 w-auto shrink-0 sm:h-24 lg:h-28"
                style={{ ['--float-rot' as string]: '-3deg' }}
              />
            </article>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
