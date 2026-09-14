'use client';

import { useState } from 'react';
import { Button } from './Button';
import { STUDIO } from '@/lib/config';

/**
 * Formulaire de contact.
 *
 * ⚠️ DÉMO : rien n'est envoyé. Le message reste dans le navigateur.
 * MIGRATION : POST vers /api/contact, qui relaie vers la boîte du studio via un
 * service transactionnel. Prévoir une protection anti-spam côté serveur
 * (jeton + limitation de débit) plutôt qu'un captcha, moins accessible.
 */
const SUBJECTS = [
  'Question sur les formules',
  'Réserver un créneau particulier',
  'Modifier ou annuler un rendez-vous',
  'Séance en entreprise',
  'Autre',
];

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[1.75rem] border-2 border-jade/40 bg-jade/10 p-7">
        <span className="grid size-11 place-items-center rounded-full bg-jade text-creme">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-5">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
        </span>
        <h2 className="text-[length:var(--text-2xl)]">Message envoyé.</h2>
        <p className="leading-relaxed text-anthracite/72">
          {STUDIO.coach.firstName} répond sous 24&nbsp;h ouvrées. Si c’est urgent, le téléphone reste le plus
          rapide&nbsp;: <a href={`tel:${STUDIO.phoneHref}`} className="font-semibold text-orange">{STUDIO.phone}</a>.
        </p>
        <p className="text-[length:var(--text-2xs)] text-anthracite/45">
          Démonstration&nbsp;: aucun message n’a réellement été transmis.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
      className="flex flex-col gap-5 rounded-[1.75rem] border-2 border-anthracite/12 bg-blanc p-6 sm:p-8"
    >
      <h2 className="text-[length:var(--text-2xl)]">Écrire au studio</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="firstName" autoComplete="given-name" required />
        <Field label="Nom" name="lastName" autoComplete="family-name" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Téléphone" name="phone" type="tel" autoComplete="tel" optional />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
          Sujet
        </span>
        <select
          name="subject"
          required
          defaultValue={SUBJECTS[0]}
          className="min-h-12 rounded-xl border-2 border-anthracite/15 bg-creme px-4 outline-none transition-colors focus:border-orange"
        >
          {SUBJECTS.map((subject) => (
            <option key={subject}>{subject}</option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
          Votre message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Dites-nous où vous en êtes et ce que vous cherchez."
          className="resize-y rounded-xl border-2 border-anthracite/15 bg-creme p-4 outline-none transition-colors focus:border-orange"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-[length:var(--text-xs)] leading-relaxed text-anthracite/70">
        <input type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-orange" />
        <span>
          J’accepte que ces informations soient utilisées pour me répondre. Elles ne servent à rien d’autre et ne
          sont jamais transmises à un tiers.
        </span>
      </label>

      <Button type="submit" size="md" block>
        Envoyer le message
      </Button>

      <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/45">
        Démonstration&nbsp;: ce formulaire n’envoie rien et ne conserve aucune donnée.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required,
  optional,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
        {label}
        {optional && <span className="ml-1.5 font-normal normal-case tracking-normal text-anthracite/35">(facultatif)</span>}
      </span>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        required={required}
        className="min-h-12 rounded-xl border-2 border-anthracite/15 bg-creme px-4 outline-none transition-colors focus:border-orange"
      />
    </label>
  );
}
