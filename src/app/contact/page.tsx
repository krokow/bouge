import type { Metadata } from 'next';
import { ContactForm } from '@/components/ui/ContactForm';
import { StudioMap } from '@/components/ui/StudioMap';
import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { PageHero } from '@/components/ui/PageHero';
import { Reveal } from '@/components/ui/Reveal';
import { OPENING_HOURS, STUDIO } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    `Contacter le studio ${STUDIO.name} à ${STUDIO.address.city} : téléphone, email, adresse, horaires et accès.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>Une question avant de venir ?</>}
        intro={
          <>
            Pour réserver, le plus simple reste le site&nbsp;: les créneaux affichés sont réellement libres. Pour
            tout le reste, écrivez ou appelez, c’est {STUDIO.coach.firstName} qui répond.
          </>
        }
      />

      <section className="u-section bg-creme">
        <div className="u-container grid items-start gap-[var(--spacing-fluid-4)] lg:grid-cols-[1fr_0.85fr]">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal delay={120} className="lg:sticky lg:top-28">
            <div className="flex flex-col gap-5">
              <div className="u-card flex flex-col gap-5 p-6 sm:p-7">
                <h2 className="text-[length:var(--text-2xl)]">En direct</h2>

                <a
                  href={`tel:${STUDIO.phoneHref}`}
                  className="group flex items-center gap-4 rounded-2xl bg-orange/10 p-4 no-underline transition-colors hover:bg-orange/18"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-orange text-creme">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/50">
                      Téléphone
                    </span>
                    <span className="truncate font-semibold text-anthracite">{STUDIO.phone}</span>
                  </span>
                </a>

                <a
                  href={`mailto:${STUDIO.email}`}
                  className="group flex items-center gap-4 rounded-2xl bg-jade/10 p-4 no-underline transition-colors hover:bg-jade/18"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-jade text-creme">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                      <rect x="3" y="5" width="18" height="14" rx="2.5" />
                      <path d="M3.5 7l8.5 6 8.5-6" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/50">
                      Email
                    </span>
                    <span className="truncate font-semibold text-anthracite">{STUDIO.email}</span>
                  </span>
                </a>

                <div className="flex flex-col gap-2 border-t border-anthracite/10 pt-5">
                  <h3 className="font-sans text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/50">
                    Adresse
                  </h3>
                  <address className="not-italic leading-relaxed text-anthracite/80">
                    {STUDIO.legalName}
                    <br />
                    {STUDIO.address.street}
                    <br />
                    {STUDIO.address.postalCode} {STUDIO.address.city}
                  </address>
                </div>

                <div className="flex flex-col gap-2 border-t border-anthracite/10 pt-5">
                  <h3 className="font-sans text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/50">
                    Horaires
                  </h3>
                  <ul className="flex flex-col gap-1.5 text-[length:var(--text-sm)] text-anthracite/78">
                    {OPENING_HOURS.map((row) => (
                      <li key={row.days} className="flex flex-wrap justify-between gap-x-4">
                        <span>{row.days}</span>
                        <span className="text-anthracite/50">{row.hours}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-2 border-t border-anthracite/10 pt-5">
                  <h3 className="font-sans text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/50">
                    Accès
                  </h3>
                  <ul className="flex flex-col gap-1.5 text-[length:var(--text-sm)] text-anthracite/78">
                    {STUDIO.access.map((item) => (
                      <li key={item.label} className="flex flex-wrap justify-between gap-x-4">
                        <span>{item.label}</span>
                        <span className="text-anthracite/50">{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <StudioMap />

              <ButtonLink href={BOOKING_HREF} size="md" block>
                Réserver en ligne <ArrowRight />
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
