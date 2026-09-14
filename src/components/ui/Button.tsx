import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

type Variant = 'primary' | 'dark' | 'cream' | 'outline' | 'ghost' | 'jade';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-orange text-creme hover:bg-orange-dark shadow-[0_10px_28px_-12px_rgba(226,97,41,0.85)] hover:shadow-[0_16px_38px_-12px_rgba(226,97,41,0.95)]',
  jade: 'bg-jade text-creme hover:bg-jade-dark shadow-[0_10px_28px_-12px_rgba(67,150,119,0.8)]',
  dark: 'bg-anthracite text-creme hover:bg-anthracite-700',
  cream: 'bg-creme text-anthracite hover:bg-blanc',
  outline: 'border-2 border-current bg-transparent hover:bg-current/10',
  ghost: 'bg-transparent hover:bg-anthracite/8',
};

const SIZES: Record<Size, string> = {
  // min-h ≥ 44px : cible tactile confortable, y compris sur petit mobile.
  sm: 'min-h-11 px-4 py-2 text-sm',
  md: 'min-h-12 px-6 py-3 text-base',
  lg: 'min-h-14 px-8 py-4 text-lg',
};

const BASE =
  'group/btn relative inline-flex items-center justify-center gap-2.5 rounded-full font-semibold ' +
  'tracking-tight no-underline transition-[transform,background-color,box-shadow,opacity] duration-300 ' +
  'ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-0.5 active:translate-y-0 ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
  /** Occupe toute la largeur — utilisé par défaut sur mobile dans le tunnel. */
  block?: boolean;
}

function classes({ variant = 'primary', size = 'md', block, className = '' }: CommonProps): string {
  return [BASE, VARIANTS[variant], SIZES[size], block ? 'w-full' : '', className].filter(Boolean).join(' ');
}

export function Button({
  variant,
  size,
  block,
  className,
  children,
  ...rest
}: CommonProps & ComponentPropsWithoutRef<'button'>) {
  return (
    <button className={classes({ variant, size, block, className, children })} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size,
  block,
  className,
  children,
  external,
  ...rest
}: CommonProps & { href: string; external?: boolean } & Omit<ComponentPropsWithoutRef<'a'>, 'href'>) {
  const cls = classes({ variant, size, block, className, children });
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

/** Flèche animée, utilisée dans les CTA principaux. */
export function ArrowRight({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-[1.1em] transition-transform duration-300 group-hover/btn:translate-x-1 ${className}`}
    >
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}
