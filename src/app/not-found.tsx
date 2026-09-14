import { ArrowRight, ButtonLink } from '@/components/ui/Button';
import { asset, STUDIO } from '@/lib/config';
import { BOOKING_HREF } from '@/lib/nav';

export default function NotFound() {
  return (
    <section className="u-grain relative flex min-h-[80svh] items-center overflow-hidden bg-anthracite py-[var(--spacing-fluid-6)] text-creme">
      <div className="u-container relative flex flex-col items-center gap-6 text-center">
        <img
          src={asset('/brand/mascotte-face-light.webp')}
          alt=""
          width={512}
          height={405}
          className="u-float h-24 w-auto opacity-90 sm:h-32"
        />
        <p className="font-display text-[length:var(--text-7xl)] leading-none text-orange">404</p>
        <h1 className="max-w-[18ch] text-[length:var(--text-4xl)]">Cette page a filé à l’entraînement.</h1>
        <p className="max-w-[46ch] text-creme/70">
          Le lien que vous avez suivi ne mène nulle part. Revenez à l’accueil, ou allez directement au plus
          utile&nbsp;: choisir un créneau.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ButtonLink href={BOOKING_HREF} size="lg">
            Prendre rendez-vous <ArrowRight />
          </ButtonLink>
          <ButtonLink href="/" size="lg" variant="outline" className="text-creme">
            Retour à l’accueil
          </ButtonLink>
        </div>
        <p className="pt-2 font-hand text-2xl text-creme/50">{STUDIO.slogan}</p>
      </div>
    </section>
  );
}
