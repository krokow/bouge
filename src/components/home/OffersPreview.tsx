import { OFFERS } from '@/data/offers';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { OfferCard } from '@/components/ui/OfferCard';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

export function OffersPreview() {
  return (
    <section id="offres" className="u-section bg-anthracite text-creme">
      <div className="u-container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Nos formules"
            tone="light"
            title={
              <>
                Quatre façons
                <br />
                de s’y mettre.
              </>
            }
            intro={
              <>
                Toutes durent une heure, toutes se réservent en ligne. La différence tient au nombre de personnes
                dans la pièce et au rythme que vous voulez tenir.
              </>
            }
            className="[&_h2]:text-creme"
          />
          <Reveal delay={200} className="shrink-0">
            <ButtonLink href="/offres/" variant="cream" size="md">
              Comparer les formules <ArrowRight />
            </ButtonLink>
          </Reveal>
        </div>

        <ul className="mt-[var(--spacing-fluid-5)] grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
          {OFFERS.map((offer, i) => (
            <Reveal as="li" key={offer.id} delay={i * 90} className="h-full">
              <OfferCard offer={offer} />
            </Reveal>
          ))}
        </ul>

        <Reveal delay={120}>
          <p className="mt-8 text-center text-[length:var(--text-sm)] text-creme/55">
            Paiement sur place ou en ligne. Annulation libre jusqu’à 24&nbsp;h avant la séance.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
