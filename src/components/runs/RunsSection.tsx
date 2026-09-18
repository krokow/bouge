'use client';

import Link from 'next/link';
import { RunCard } from './RunCard';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset, MAX_PARTICIPANTS, STUDIO } from '@/lib/config';
import { RUN_CAPACITY } from '@/lib/runs';
import { useMounted, useUpcomingRuns } from '@/lib/hooks/useDatabase';

/**
 * Les sorties collectives gratuites, sur le site public.
 *
 * ── Ce que cette section doit désamorcer ────────────────────────────────────
 * Tout le site promet « trois personnes maximum, jamais plus ». Annoncer une
 * sortie à dix sans rien dire donnerait l'impression que le studio se renie.
 * Le texte pose donc franchement la différence : le studio, c'est trois ;
 * le run, c'est autre chose — dehors, gratuit, pour se rencontrer.
 *
 * ── Quand il n'y a rien de programmé ────────────────────────────────────────
 * La section ne disparaît pas : elle annonce que les dates arrivent. Une
 * rubrique qui s'évapore laisse croire que le studio a abandonné l'idée,
 * alors qu'une promesse datée fait revenir.
 *
 * Les sorties vivent dans la base : le rendu se fait côté navigateur, et rien
 * ne s'affiche pendant l'hydratation plutôt qu'un contenu qui sauterait.
 */
export function RunsSection({
  /**
   * L'orange est la couleur d'action de la marque, et aucune autre section du
   * site ne l'emploie en aplat : les runs ont ainsi leur propre signal, qu'on
   * reconnaît d'une page à l'autre. C'est aussi ce qui répond à la demande
   * « bien visible ».
   */
  tone = 'orange',
  /** Deux sorties sur l'accueil, toutes sur la page des offres. */
  limit,
  id,
}: {
  tone?: 'orange' | 'anthracite' | 'creme';
  limit?: number;
  id?: string;
}) {
  const runs = useUpcomingRuns();
  const mounted = useMounted();

  const onColour = tone !== 'creme';
  const dark = onColour; // cartes sombres sur aplat de couleur, claires sur crème
  const background =
    tone === 'orange'
      ? 'u-grain bg-orange text-creme'
      : tone === 'anthracite'
        ? 'u-grain bg-anthracite text-creme'
        : 'bg-creme';

  const shown = limit ? runs.slice(0, limit) : runs;
  const hidden = runs.length - shown.length;

  return (
    <section id={id} className={`u-section relative overflow-hidden ${background}`}>
      {onColour && (
        <img
          src={asset('/brand/mascotte-run-light.webp')}
          alt=""
          width={760}
          height={640}
          loading="lazy"
          className="u-float pointer-events-none absolute -bottom-6 right-[3vw] hidden h-48 w-auto opacity-20 lg:block"
        />
      )}

      <div className="u-container relative">
        {/* Badge plein plutôt que le petit intitulé habituel : sur l'aplat
            orange, un texte crème de cette taille tomberait sous le seuil de
            contraste lisible. Renversé en pastille crème, il passe largement
            — et « GRATUIT » mérite d'être ce qu'on voit en premier. */}
        <Reveal>
          <p
            className={[
              'mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5',
              'text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.18em]',
              tone === 'orange'
                ? 'bg-creme text-orange-dark'
                : tone === 'anthracite'
                  ? 'bg-orange text-creme'
                  : 'bg-orange/12 text-orange-dark',
            ].join(' ')}
          >
            Gratuit — ouvert à tous
          </p>
        </Reveal>

        <SectionHeading
          tone={onColour ? 'light' : 'dark'}
          title="Les runs BOUGE."
          intro={
            <>
              De temps en temps, {STUDIO.coach.firstName} emmène {RUN_CAPACITY} personnes courir. C’est
              gratuit, ça se passe dehors, et le but n’est pas la performance&nbsp;: on court à l’allure du
              groupe, on discute, on se rencontre. Rien à voir avec les séances du studio, qui restent à{' '}
              {MAX_PARTICIPANTS} au maximum — ici on vient justement pour être plus nombreux.
            </>
          }
          className={onColour ? '[&_h2]:text-creme [&>div:last-child]:text-creme/85' : ''}
        />

        <div className="mt-[var(--spacing-fluid-4)]">
          {!mounted ? (
            <div
              aria-hidden="true"
              className={`h-44 animate-pulse rounded-[1.5rem] ${dark ? 'bg-creme/5' : 'bg-anthracite/6'}`}
            />
          ) : shown.length === 0 ? (
            <Empty dark={dark} />
          ) : (
            <>
              <ul className="grid items-start gap-4 md:grid-cols-2">
                {shown.map(({ run, left, mine }, i) => (
                  <Reveal as="li" key={run.id} delay={i * 80} className="h-full">
                    <RunCard run={run} left={left} mine={mine} tone={dark ? 'dark' : 'light'} />
                  </Reveal>
                ))}
              </ul>
              {hidden > 0 && (
                <p className={`mt-4 text-[length:var(--text-sm)] ${dark ? 'text-creme/60' : 'text-anthracite/60'}`}>
                  {hidden === 1 ? 'Une autre sortie est programmée' : `${hidden} autres sorties sont programmées`}
                  {' — '}
                  <Link
                    href="/offres/#les-runs"
                    className={onColour ? 'text-creme underline underline-offset-4' : 'text-orange-dark underline underline-offset-4'}
                  >
                    voir toutes les dates
                  </Link>
                  .
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Aucune date programmée.
 *
 * Le message promet plutôt qu'il n'excuse : le visiteur repart avec une raison
 * de revenir, et le studio garde la main sur le rythme.
 */
function Empty({ dark }: { dark: boolean }) {
  return (
    <div
      className={[
        'flex flex-col items-start gap-3 rounded-[1.5rem] border-2 border-dashed p-6 sm:p-8',
        dark ? 'border-creme/20' : 'border-anthracite/15',
      ].join(' ')}
    >
      <p className="font-display text-[length:var(--text-2xl)] leading-none">
        Les prochaines dates arrivent bientôt.
      </p>
      <p className={`max-w-[56ch] text-[length:var(--text-base)] leading-relaxed ${dark ? 'text-creme/70' : 'text-anthracite/65'}`}>
        Aucune sortie n’est programmée pour l’instant. Les prochaines seront annoncées ici et sur le compte
        Instagram du studio — les places partent vite, il n’y en a que {RUN_CAPACITY}.
      </p>
    </div>
  );
}
