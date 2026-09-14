import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-2.5 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.22em] ${className}`}>
      <span aria-hidden="true" className="inline-block h-[2px] w-7 rounded-full bg-current opacity-60" />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
  tone = 'dark',
  className = '',
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: 'left' | 'center';
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';
  const introTone = tone === 'light' ? 'text-creme/70' : 'text-anthracite/72';
  const eyebrowTone = tone === 'light' ? 'text-orange' : 'text-orange';

  return (
    <div className={`flex flex-col gap-4 ${alignment} ${className}`}>
      {eyebrow && (
        <Reveal delay={0}>
          <Eyebrow className={eyebrowTone}>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={80}>
        <h2 className="max-w-[18ch] text-[length:var(--text-5xl)]">{title}</h2>
      </Reveal>
      {intro && (
        <Reveal delay={160}>
          <div className={`max-w-[58ch] text-[length:var(--text-lg)] leading-relaxed ${introTone}`}>{intro}</div>
        </Reveal>
      )}
    </div>
  );
}
