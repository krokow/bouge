import type { Metadata } from 'next';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset, STUDIO } from '@/lib/config';
import { NotifyForm } from '@/components/ui/NotifyForm';

export const metadata: Metadata = {
  title: 'Ostéopathie — bientôt disponible',
  description:
    `Un cabinet d’ostéopathie ouvrira au sein du studio ${STUDIO.name} à ${STUDIO.address.city} : ` +
    'cabinet dédié, salle d’attente séparée, échange direct avec votre coach. Réservation à venir.',
};

const STEPS = [
  {
    title: 'Un cabinet, pas un coin de salle',
    text:
      'Une pièce fermée, dédiée, avec sa propre table et son propre matériel. Rien à voir avec un paravent posé ' +
      'dans l’espace de coaching : c’est un cabinet à part entière, avec la confidentialité que ça suppose.',
  },
  {
    title: 'Une salle d’attente qui vit',
    text:
      'Un espace calme, séparé de la zone d’entraînement : on n’attend pas son rendez-vous assis au milieu ' +
      'd’une séance en cours. C’est la même salle que celle du studio, avec son comptoir — boissons chaudes ' +
      'et fraîches, et le vestiaire BOUGE. sur les étagères. On peut y arriver en avance sans que ce soit une punition.',
  },
  {
    title: 'Un dialogue avec votre coach',
    text:
      'Avec votre accord explicite, l’ostéopathe et Melvin échangent sur ce qui coince. Votre programme ' +
      's’adapte à ce qui a été constaté, et la séance d’ostéopathie tient compte de ce que vous travaillez.',
  },
];

export default function OsteopathiePage() {
  return (
    <>
      <PageHero
        eyebrow="Bientôt disponible"
        tone="jade"
        title={<>L’ostéopathie arrive au studio.</>}
        intro={
          <>
            Le projet est simple&nbsp;: réunir dans un même lieu quelqu’un qui vous fait bouger et quelqu’un qui
            regarde pourquoi ça bloque. Le cabinet est en cours d’aménagement.
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-3 pt-3">
          {/* Aucun lien de réservation : le service n'est pas ouvert. */}
          <span className="inline-flex items-center gap-2.5 rounded-full border border-creme/30 bg-creme/10 px-5 py-3 text-[length:var(--text-sm)] font-semibold backdrop-blur-sm">
            <span aria-hidden="true" className="size-2.5 animate-pulse rounded-full bg-creme" />
            Réservation en ligne pas encore ouverte
          </span>
        </div>
      </PageHero>

      <section className="u-section bg-creme">
        <div className="u-container grid items-start gap-[var(--spacing-fluid-4)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Ce qui est prévu"
              title="Deux métiers, un seul lieu."
              intro={
                <>
                  Beaucoup de douleurs récurrentes ne se règlent ni uniquement chez l’ostéopathe, ni uniquement à
                  l’entraînement. Elles se règlent quand les deux se parlent. C’est exactement ce qu’on met en place.
                </>
              }
            />

            <ol className="flex flex-col gap-5">
              {STEPS.map((step, i) => (
                <Reveal as="li" key={step.title} delay={i * 100}>
                  <div className="flex gap-4 border-l-2 border-jade/35 pl-5">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-[length:var(--text-xl)]">{step.title}</h3>
                      <p className="max-w-[54ch] leading-relaxed text-anthracite/75">{step.text}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <Reveal delay={140} className="lg:sticky lg:top-28">
            <div className="flex flex-col gap-5">
              <img
                src={asset('/media/osteo-salle-attente.webp')}
                alt="La future salle d’attente du cabinet"
                width={1600}
                height={1100}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-[1.75rem] object-cover"
              />
              <NotifyForm />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="u-section bg-anthracite text-creme">
        <div className="u-container flex flex-col items-center gap-7 text-center">
          <img
            src={asset('/brand/mascotte-face-light.webp')}
            alt=""
            width={512}
            height={405}
            loading="lazy"
            className="u-float h-20 w-auto opacity-80"
          />
          <h2 className="max-w-[20ch] text-[length:var(--text-4xl)]">
            En attendant, le coaching, lui, est ouvert.
          </h2>
          <p className="max-w-[52ch] text-creme/70">
            Si vous avez une douleur qui revient, dites-le en réservant&nbsp;: la séance sera construite autour, et
            Melvin vous orientera vers un praticien s’il estime que ça relève d’un avis médical.
          </p>
          <ButtonLink href="/reserver/" size="lg">
            Réserver une séance de coaching <ArrowRight />
          </ButtonLink>
        </div>
      </section>
    </>
  );
}
