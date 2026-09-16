import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { InstagramIcon } from '@/components/ui/InstagramIcon';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset, INSTAGRAM_HANDLE, INSTAGRAM_URL, SOCIAL, STUDIO } from '@/lib/config';
import { getInstagramPosts } from '@/lib/instagram';

/**
 * La communauté Instagram, sur la page À propos.
 *
 * Le compte de Melvin est le principal actif de notoriété du studio : il vaut
 * mieux l'afficher que le laisser dans le pied de page. La section reste
 * volontairement un lien, pas un widget — aucune requête n'est envoyée à
 * Instagram tant que le visiteur ne clique pas, donc aucun traceur tiers et
 * rien à soumettre au bandeau de consentement.
 *
 * Fond clair : elle s'intercale entre la bande sombre des valeurs et l'appel à
 * l'action orange, et maintient l'alternance clair / sombre de la page.
 *
 * La grille se construit à partir de `getInstagramPosts()`. Si cette fonction
 * renvoie un tableau vide, la section s'affiche sans elle et le texte occupe
 * alors toute la largeur : c'est le repli prévu tant qu'on n'a pas de vraies
 * publications à montrer.
 */
export function InstagramCommunity() {
  const posts = getInstagramPosts();
  const hasPosts = posts.length > 0;

  return (
    <section className="u-section bg-creme">
      <div className="u-container">
        <div
          className={`grid items-center gap-[var(--spacing-fluid-4)] ${
            hasPosts ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]' : ''
          }`}
        >
          <div className="flex flex-col gap-[var(--spacing-fluid-3)]">
            <SectionHeading
              eyebrow="Communauté"
              title="Le studio est neuf. L’audience, non."
              intro={
                <>
                  {STUDIO.coach.firstName} publie depuis des années sur Instagram, et c’est là que la plupart des
                  personnes qui poussent la porte du studio l’ont découvert. {STUDIO.name} ouvre donc avec une
                  communauté déjà constituée, pas avec une page blanche.
                </>
              }
            />

            {/* Le chiffre, isolé : c'est l'argument de la section. */}
            <Reveal delay={200}>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex flex-col gap-1 border-l-2 border-orange pl-5 no-underline"
              >
                <span className="font-display text-[length:var(--text-6xl)] leading-none text-orange">
                  +{SOCIAL.instagram.followersLabel}
                </span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[length:var(--text-sm)] uppercase tracking-[0.14em] text-anthracite/60 transition-colors group-hover:text-anthracite">
                  <span>abonnés sur</span>
                  {/* Le pseudonyme échappe à la capitalisation de la ligne :
                      un identifiant Instagram s'écrit en minuscules. */}
                  <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-anthracite">
                    <InstagramIcon className="size-4" />
                    {INSTAGRAM_HANDLE}
                  </span>
                </span>
              </a>
            </Reveal>

            <Reveal delay={260}>
              {/* Variante sombre : l'appel à l'action orange de la section
                  suivante doit rester le bouton le plus fort de la page. */}
              <ButtonLink href={INSTAGRAM_URL} external variant="dark" size="lg">
                <InstagramIcon className="size-5" />
                Suivre {INSTAGRAM_HANDLE}
                <ArrowRight />
              </ButtonLink>
            </Reveal>
          </div>

          {hasPosts && (
            <Reveal delay={120} className="w-full">
              <ul className="grid grid-cols-2 gap-3 sm:gap-4">
                {posts.map((post, index) => (
                  <li key={post.id}>
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block overflow-hidden rounded-[1.25rem] no-underline sm:rounded-[1.5rem]"
                    >
                      <img
                        src={asset(post.image)}
                        alt={post.alt}
                        width={1200}
                        height={1200}
                        loading="lazy"
                        decoding="async"
                        className="aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      />

                      {/* Voile permanent sur la moitié basse : garantit la
                          lisibilité de la légende quelle que soit la photo qui
                          viendra la remplacer. */}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-1/2"
                        style={{
                          background: 'linear-gradient(to top, rgba(18,18,20,0.88) 0%, transparent 100%)',
                        }}
                      />

                      <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-anthracite/55 text-creme backdrop-blur-sm transition-colors group-hover:bg-orange">
                        <InstagramIcon className="size-4" />
                      </span>

                      <span className="absolute inset-x-3 bottom-3 block text-balance text-[length:var(--text-xs)] leading-snug text-creme sm:inset-x-4 sm:bottom-4">
                        {post.caption}
                      </span>

                      {/* Le lecteur d'écran a besoin de savoir où mène le lien :
                          la légende seule ne le dit pas. Formulation valable
                          aussi bien maintenant, où toutes les vignettes mènent
                          au profil, que plus tard, où chacune mènera à sa
                          publication. */}
                      <span className="sr-only">
                        — vignette {index + 1} sur {posts.length}, ouvrir sur Instagram (nouvel onglet)
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
