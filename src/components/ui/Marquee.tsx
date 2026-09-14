import { asset } from '@/lib/config';

/**
 * Bandeau défilant.
 *
 * Le contenu est dupliqué une fois et la piste translate de -50 % : la boucle
 * est invisible. L'animation porte sur `transform` uniquement (composition GPU),
 * et `prefers-reduced-motion` la neutralise depuis globals.css.
 */
export function Marquee({
  items,
  className = '',
  tone = 'orange',
}: {
  items: string[];
  className?: string;
  tone?: 'orange' | 'anthracite' | 'jade';
}) {
  const tones = {
    orange: 'bg-orange text-creme',
    anthracite: 'bg-anthracite text-creme',
    jade: 'bg-jade text-creme',
  } as const;

  const sequence = [...items, ...items];

  return (
    <div
      className={`relative flex overflow-hidden py-3.5 ${tones[tone]} ${className}`}
      role="presentation"
      aria-hidden="true"
    >
      <div className="u-marquee-track flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
        {sequence.map((item, i) => (
          <span key={`${item}-${i}`} className="flex shrink-0 items-center gap-8 sm:gap-12">
            <span className="whitespace-nowrap font-display text-[length:var(--text-xl)] uppercase leading-none tracking-tight">
              {item}
            </span>
            <img
              src={asset('/brand/monogram-anthracite.webp')}
              alt=""
              width={512}
              height={492}
              loading="lazy"
              className="size-5 shrink-0 opacity-45 sm:size-6"
            />
          </span>
        ))}
      </div>
    </div>
  );
}
