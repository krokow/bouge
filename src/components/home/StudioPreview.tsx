import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { asset } from '@/lib/config';

const FEATURES = [
  { title: 'Douche & vestiaire', detail: 'Serviettes fournies, casiers fermés, produits d’hygiène sur place.' },
  { title: 'Un seul groupe à la fois', detail: 'Pas de file d’attente devant une machine. L’espace est à vous.' },
  { title: 'Matériel choisi', detail: 'Charges libres, kettlebells, élastiques, rameur. Ce qui sert, rien d’autre.' },
  { title: 'Lumière et calme', detail: 'Pas de néons blafards ni de musique poussée à fond. On s’entend parler.' },
];

export function StudioPreview() {
  return (
    <section className="u-section bg-creme">
      <div className="u-container grid items-center gap-[var(--spacing-fluid-4)] lg:grid-cols-2 lg:gap-[var(--spacing-fluid-5)]">
        {/* Mosaïque de visuels — se replie en une seule colonne sous 640px */}
        <Reveal className="order-2 lg:order-1">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <img
              src={asset('/media/studio-espace-coaching.webp')}
              alt="L’espace de coaching du studio"
              width={1600}
              height={1100}
              loading="lazy"
              className="col-span-2 aspect-[16/10] w-full rounded-[1.5rem] object-cover"
            />
            <img
              src={asset('/media/studio-vestiaire.webp')}
              alt="Le vestiaire"
              width={1600}
              height={1100}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-[1.5rem] object-cover"
            />
            <img
              src={asset('/media/studio-douches.webp')}
              alt="Les douches"
              width={1600}
              height={1100}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-[1.5rem] object-cover"
            />
          </div>
        </Reveal>

        <div className="order-1 flex flex-col gap-7 lg:order-2">
          <SectionHeading
            eyebrow="Le lieu"
            title={
              <>
                Un studio,
                <br />
                <span className="u-mark">pas un hangar.</span>
              </>
            }
            intro={
              <>
                Une seule pièce, pensée pour qu’on puisse y travailler sérieusement sans avoir l’impression d’être
                dans un supermarché du muscle. Vous poussez la porte, c’est votre créneau, il n’y a personne
                d’autre.
              </>
            }
          />

          <ul className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, i) => (
              <Reveal as="li" key={feature.title} delay={i * 90}>
                <div className="flex h-full flex-col gap-1.5 border-l-2 border-orange/40 pl-4">
                  <h3 className="font-sans text-[length:var(--text-base)] font-bold leading-snug tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/68">{feature.detail}</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={120}>
            <ButtonLink href="/studio/" variant="dark" size="md">
              Visiter le studio <ArrowRight />
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
