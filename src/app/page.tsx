import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Manifesto } from '@/components/home/Manifesto';
import { OffersPreview } from '@/components/home/OffersPreview';
import { OsteoTeaser } from '@/components/home/OsteoTeaser';
import { StudioPreview } from '@/components/home/StudioPreview';
import { Testimonials } from '@/components/home/Testimonials';
import { RunsSection } from '@/components/runs/RunsSection';
import { Marquee } from '@/components/ui/Marquee';
import { STUDIO } from '@/lib/config';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee items={['Bougez.', 'Rencontrez.', 'Recommencez.', STUDIO.claim]} />
      <Manifesto />
      <OffersPreview />
      {/* Les formules payantes, puis la porte d'entrée gratuite : c'est
          l'enchaînement qui donne sa raison d'être au run. Deux dates
          seulement ici, le reste sur la page des offres. */}
      <RunsSection limit={2} />
      <StudioPreview />
      <HowItWorks />
      <Testimonials />
      <OsteoTeaser />
    </>
  );
}
