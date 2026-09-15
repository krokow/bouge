import type { ComponentPropsWithoutRef, ReactNode } from 'react';

const INPUT_CLASS =
  'min-h-12 w-full min-w-0 max-w-full rounded-xl border-2 border-anthracite/15 bg-creme px-4 text-anthracite outline-none ' +
  'transition-colors duration-200 placeholder:text-anthracite/35 focus:border-orange ' +
  'aria-[invalid=true]:border-orange aria-[invalid=true]:bg-orange/5';

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
        {children}
      </span>
      {hint && <span className="text-[length:var(--text-2xs)] text-anthracite/35">{hint}</span>}
    </span>
  );
}

export function TextField({
  label,
  hint,
  error,
  id,
  className = '',
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
} & ComponentPropsWithoutRef<'input'>) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <Label hint={hint}>{label}</Label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`${INPUT_CLASS} ${className}`}
        {...rest}
      />
      {error && (
        <span id={errorId} role="alert" className="text-[length:var(--text-xs)] font-medium text-orange-dark">
          {error}
        </span>
      )}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  id,
  className = '',
  ...rest
}: { label: string; hint?: string } & ComponentPropsWithoutRef<'textarea'>) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <Label hint={hint}>{label}</Label>
      <textarea
        id={id}
        className={`resize-y rounded-xl border-2 border-anthracite/15 bg-creme p-4 text-anthracite outline-none transition-colors duration-200 placeholder:text-anthracite/35 focus:border-orange ${className}`}
        {...rest}
      />
    </label>
  );
}

export function Checkbox({
  children,
  id,
  ...rest
}: { children: ReactNode } & ComponentPropsWithoutRef<'input'>) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[length:var(--text-sm)] leading-relaxed text-anthracite/75">
      <input id={id} type="checkbox" className="mt-0.5 size-5 shrink-0 accent-orange" {...rest} />
      <span>{children}</span>
    </label>
  );
}

/** Bandeau d'erreur d'un formulaire entier. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2.5 rounded-xl border-2 border-orange/45 bg-orange/10 px-4 py-3 text-[length:var(--text-sm)] font-medium text-anthracite">
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 size-4 shrink-0 text-orange-dark" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4.5M10 13.6v.1" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}
