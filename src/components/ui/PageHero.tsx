import type { ReactNode } from 'react';
import { asset } from '@/lib/config';

/**
 * En-tête des pages intérieures.
 * Fond anthracite : la navbar est opaque dès le haut de page sur ces pages,
 * le contraste du logo crème est donc toujours garanti.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
  mascotte,
  tone = 'anthracite',
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
  /** Nom de fichier d'une mascotte de `public/brand`, en décor. */
  mascotte?: string;
  tone?: 'anthracite' | 'jade' | 'brun';
}) {
  const tones = {
    anthracite: 'bg-anthracite',
    jade: 'bg-jade',
    brun: 'bg-brun',
  } as const;

  return (
    <section
      className={`u-grain relative overflow-hidden pb-[var(--spacing-fluid-5)] pt-[clamp(6.5rem,14vh,10rem)] text-creme ${tones[tone]}`}
    >
      {mascotte && (
        <img
          src={asset(`/brand/${mascotte}`)}
          alt=""
          width={760}
          height={760}
          className="u-float pointer-events-none absolute -bottom-4 right-[4vw] hidden h-48 w-auto opacity-25 lg:block xl:h-60"
        />
      )}

      <div className="u-container relative flex flex-col gap-5">
        {eyebrow && (
          <p className="flex items-center gap-2.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.22em] text-orange">
            <span aria-hidden="true" className="inline-block h-[2px] w-7 rounded-full bg-current opacity-60" />
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-[16ch] text-[length:var(--text-6xl)]">{title}</h1>
        {intro && (
          <div className="max-w-[58ch] text-[length:var(--text-lg)] leading-relaxed text-creme/72">{intro}</div>
        )}
        {children}
      </div>
    </section>
  );
}

/** Mise en page des pages légales : colonne unique, lecture confortable. */
export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow="Informations légales" title={title} intro={`Dernière mise à jour : ${updatedAt}.`} />
      <div className="u-section bg-creme">
        <div className="u-container">
          <div
            className="
              mx-auto max-w-[68ch]
              [&_a]:text-orange [&_a]:underline-offset-4 hover:[&_a]:underline
              [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:text-[length:var(--text-3xl)] first:[&_h2]:mt-0
              [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-[length:var(--text-xl)]
              [&_li]:mb-2 [&_li]:leading-relaxed
              [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-anthracite/80
              [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-anthracite/80
              [&_table]:w-full [&_table]:min-w-[34rem] [&_table]:border-collapse [&_table]:text-sm
              [&_td]:border-t [&_td]:border-anthracite/12 [&_td]:py-2.5 [&_td]:pr-4 [&_td]:align-top
              [&_th]:border-b-2 [&_th]:border-anthracite/20 [&_th]:py-2.5 [&_th]:pr-4 [&_th]:text-left
            "
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Enveloppe de tableau.
 *
 * Un tableau de quatre colonnes ne peut pas se réduire à 375px sans devenir
 * illisible. Plutôt que de le comprimer, on lui donne son propre défilement
 * horizontal : la page, elle, ne défile jamais latéralement.
 */
export function LegalTable({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-6 overflow-x-auto overscroll-x-contain rounded-xl"
      tabIndex={0}
      role="region"
      aria-label="Tableau, défilement horizontal possible"
    >
      {children}
    </div>
  );
}

/** Encadré d'avertissement, réutilisé sur les pages de démonstration. */
export function Callout({
  title,
  children,
  tone = 'orange',
}: {
  title?: string;
  children: ReactNode;
  tone?: 'orange' | 'jade' | 'ciel';
}) {
  const tones = {
    orange: 'border-orange/40 bg-orange/8',
    jade: 'border-jade/40 bg-jade/8',
    ciel: 'border-ciel/50 bg-ciel/10',
  } as const;

  return (
    <div className={`rounded-2xl border-l-4 px-5 py-4 ${tones[tone]}`}>
      {title && <p className="mb-1.5 font-sans font-bold tracking-tight">{title}</p>}
      <div className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/80">{children}</div>
    </div>
  );
}
