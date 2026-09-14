import { Hero } from '@/components/home/Hero';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Manifesto } from '@/components/home/Manifesto';
import { OffersPreview } from '@/components/home/OffersPreview';
import { OsteoTeaser } from '@/components/home/OsteoTeaser';
import { StudioPreview } from '@/components/home/StudioPreview';
import { Testimonials } from '@/components/home/Testimonials';
import { Marquee } from '@/components/ui/Marquee';
import { STUDIO } from '@/lib/config';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee items={['Bougez.', 'Rencontrez.', 'Recommencez.', STUDIO.claim]} />
      <Manifesto />
      <OffersPreview />
      <StudioPreview />
      <HowItWorks />
      <Testimonials />
      <OsteoTeaser />
    </>
  );
}
