'use client';

import { CoachAvatar } from '@/components/ui/CoachAvatar';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { COLOR_CLASSES } from '@/lib/colors';
import { asset, STUDIO } from '@/lib/config';
import { useBookableCoaches, useMounted } from '@/lib/hooks/useDatabase';

/**
 * L'équipe du studio, sur la page À propos.
 *
 * Melvin reste la figure du lieu : il ouvre la rangée, sur une tuile plus
 * grande et à sa couleur. Les autres suivent, plus sobres — ils interviennent
 * quand il ne peut pas, la hiérarchie visuelle doit le dire sans phrase.
 *
 * La section ne porte pas de couleur de fond propre : elle prolonge le crème
 * du récit qui la précède, et se sépare par un simple filet. Un aplat blanc
 * entre deux bandes crème creusait un trou au milieu de la page. Les fiches
 * passent donc en carte blanche (`u-card`), qui est le contraste habituel du
 * site sur fond crème.
 *
 * ── La section disparaît quand il est seul ──────────────────────────────────
 * Une rubrique « l'équipe » avec une seule personne dessert le studio : elle
 * souligne qu'il n'y a personne d'autre. Tant que Melvin est le seul coach,
 * rien ne s'affiche — et la section réapparaît d'elle-même dès qu'il ajoute
 * quelqu'un depuis son espace, sans toucher au code.
 *
 * L'équipe vit dans la base : le composant est donc rendu côté navigateur, et
 * ne montre rien pendant l'hydratation plutôt qu'un contenu qui sauterait.
 */
export function TeamSection() {
  const coaches = useBookableCoaches();
  const mounted = useMounted();

  if (!mounted || coaches.length < 2) return null;

  const [lead, ...others] = coaches;

  return (
    /* Pas de bande de couleur propre : l'équipe prolonge le récit de Melvin,
       elle n'ouvre pas un chapitre séparé. Un aplat blanc entre deux sections
       crème creusait un trou au milieu de la page. Le filet en tête du
       conteneur suffit à marquer la césure, et la respiration est réduite en
       haut pour que les deux blocs se lisent d'un seul tenant. */
    <section className="bg-creme pb-[var(--spacing-fluid-6)] pt-[var(--spacing-fluid-4)]">
      <div className="u-container border-t border-anthracite/10 pt-[var(--spacing-fluid-4)]">
        <SectionHeading
          eyebrow="L’équipe"
          title="Melvin, et ceux qui prennent le relais"
          intro={
            <>
              {STUDIO.coach.firstName} assure la majorité des séances. Quand son planning est plein ou qu’il
              s’absente, il confie le studio à des coachs qu’il a choisis lui-même — vous savez toujours qui vous
              accueille avant de réserver.
            </>
          }
        />

        <ul className="mt-[var(--spacing-fluid-5)] grid gap-4 lg:grid-cols-12">
          {/* Le fondateur : tuile large, à sa couleur, avec son portrait. */}
          <Reveal as="li" className="lg:col-span-6">
            <article
              className={`u-grain relative flex h-full flex-col justify-end overflow-hidden rounded-[1.75rem] ${COLOR_CLASSES[lead.color].solid}`}
            >
              <img
                src={asset(lead.photo || '/media/melvin-portrait.webp')}
                alt={`${lead.firstName} ${lead.lastName}`}
                width={900}
                height={1125}
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-45 mix-blend-luminosity"
              />
              <div className="relative flex flex-col gap-3 p-6 sm:p-8">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-creme/20 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] backdrop-blur-sm">
                    Fondateur
                  </span>
                </p>
                <h3 className="text-[length:var(--text-4xl)] leading-none">
                  {lead.firstName} {lead.lastName}
                </h3>
                <p className="text-[length:var(--text-sm)] font-semibold uppercase tracking-[0.1em] opacity-80">
                  {lead.role}
                </p>
                {lead.bio && (
                  <p className="max-w-[44ch] text-[length:var(--text-base)] leading-relaxed opacity-90">{lead.bio}</p>
                )}
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {lead.specialties.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-creme/30 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em]"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>

          {/* Les autres coachs : cartes claires, empilées à droite. */}
          <li className="grid gap-4 lg:col-span-6 lg:auto-rows-fr">
            <ul className="grid h-full gap-4">
              {others.map((coach, i) => (
                <Reveal as="li" key={coach.id} delay={90 + i * 60} className="h-full">
                  <article className="u-card flex h-full flex-col gap-3 rounded-[1.75rem] p-5 sm:p-6">
                    <div className="flex items-center gap-4">
                      <CoachAvatar coach={coach} size="lg" />
                      <div className="flex min-w-0 flex-col gap-1">
                        <h3 className="text-[length:var(--text-2xl)] leading-none">
                          {coach.firstName} {coach.lastName}
                        </h3>
                        <p
                          className={`text-[length:var(--text-xs)] font-bold uppercase tracking-[0.12em] ${COLOR_CLASSES[coach.color].text}`}
                        >
                          {coach.role}
                        </p>
                      </div>
                    </div>
                    {coach.bio && (
                      <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">{coach.bio}</p>
                    )}
                    <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
                      {coach.specialties.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-full border border-anthracite/12 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-anthracite/55"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </article>
                </Reveal>
              ))}
            </ul>
          </li>
        </ul>

        <p className="mt-6 max-w-[62ch] text-[length:var(--text-sm)] leading-relaxed text-anthracite/60">
          Le studio n’accueille qu’une séance à la fois, quel que soit le coach. Au moment de réserver, vous
          choisissez la personne qui vous convient — ou vous laissez le studio décider selon le créneau.
        </p>
      </div>
    </section>
  );
}
