'use client';

import { useState } from 'react';
import { Button } from './Button';

/**
 * Inscription à l'alerte d'ouverture du cabinet d'ostéopathie.
 *
 * ⚠️ DÉMO : l'adresse n'est envoyée nulle part et n'est pas conservée.
 * MIGRATION : remplacer `handleSubmit` par un POST vers /api/leads, et
 * conserver la preuve du consentement (date, texte de la case cochée) —
 * c'est cette preuve qui est exigée en cas de contrôle CNIL.
 */
export function NotifyForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-[1.5rem] border-2 border-jade/40 bg-jade/10 p-6">
        <span className="grid size-10 place-items-center rounded-full bg-jade text-creme">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="size-5">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
        </span>
        <h3 className="text-[length:var(--text-xl)]">C’est noté.</h3>
        <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/72">
          Vous serez prévenu dès l’ouverture des réservations. Pas de newsletter, pas de relance&nbsp;: un seul
          email, celui-là.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setDone(true);
      }}
      className="flex flex-col gap-4 rounded-[1.5rem] border-2 border-anthracite/12 bg-blanc p-6"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-[length:var(--text-xl)]">Être prévenu de l’ouverture</h3>
        <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/68">
          Un seul email au lancement des réservations. Rien d’autre.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/55">
          Votre email
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom@email.fr"
          autoComplete="email"
          className="min-h-12 rounded-xl border-2 border-anthracite/15 bg-creme px-4 outline-none transition-colors focus:border-jade"
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-[length:var(--text-xs)] leading-relaxed text-anthracite/70">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-jade"
        />
        <span>
          J’accepte d’être contacté par email uniquement pour l’ouverture du cabinet d’ostéopathie. Je peux me
          désinscrire à tout moment.
        </span>
      </label>

      <Button type="submit" variant="jade" size="md" block>
        Me prévenir
      </Button>

      <p className="text-[length:var(--text-2xs)] leading-relaxed text-anthracite/45">
        Démonstration&nbsp;: cette adresse n’est ni envoyée ni conservée.
      </p>
    </form>
  );
}
