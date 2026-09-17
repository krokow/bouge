'use client';

import { useState } from 'react';
import { useAdminData } from './AdminScope';
import type { EmailKind } from '@/lib/types';

/**
 * Boîte d'envoi simulée.
 *
 * Elle rend visible ce que le client reçoit réellement à chaque action, ce qui
 * est très utile en démonstration. En production, ces messages partiront par un
 * service transactionnel (Brevo, Postmark, SES) déclenché côté serveur, et cet
 * écran deviendra un journal d'envoi avec les statuts de délivrance.
 */
const KIND_LABELS: Record<EmailKind, { label: string; className: string }> = {
  welcome: { label: 'Bienvenue', className: 'bg-ciel/18 text-anthracite' },
  confirmation: { label: 'Confirmation', className: 'bg-jade/18 text-jade-dark' },
  reminder: { label: 'Rappel', className: 'bg-orange/18 text-orange-dark' },
  cancellation: { label: 'Annulation', className: 'bg-brun/18 text-brun' },
  reschedule: { label: 'Report', className: 'bg-anthracite/10 text-anthracite/70' },
};

export function AdminEmails() {
  const state = useAdminData();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl border-2 border-ciel/45 bg-ciel/10 px-4 py-3 text-[length:var(--text-sm)] leading-relaxed">
        <strong>Démonstration.</strong> Aucun email n’est réellement envoyé. Cette boîte montre ce que recevrait le
        client à chaque étape, y compris le rappel automatique programmé la veille de la séance.
      </p>

      {state.emails.length === 0 ? (
        <p className="u-card px-4 py-10 text-center text-anthracite/55">
          Aucun email pour l’instant. Effectuez une réservation pour en générer.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {state.emails.map((email) => {
            const kind = KIND_LABELS[email.kind];
            const open = openId === email.id;
            return (
              <li key={email.id} className="u-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : email.id)}
                  aria-expanded={open}
                  className="flex w-full items-start gap-3 p-4 text-left"
                >
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.08em] ${kind.className}`}>
                    {kind.label}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{email.subject}</span>
                    <span className="truncate text-[length:var(--text-xs)] text-anthracite/55">
                      à {email.to}
                      {email.scheduledFor && ` · programmé pour le ${new Date(email.scheduledFor).toLocaleString('fr-FR')}`}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[length:var(--text-2xs)] font-semibold ${
                      email.status === 'sent' ? 'bg-jade/15 text-jade-dark' : 'bg-anthracite/8 text-anthracite/55'
                    }`}
                  >
                    {email.status === 'sent' ? 'Envoyé' : 'Programmé'}
                  </span>
                </button>

                {open && (
                  <pre className="overflow-x-auto whitespace-pre-wrap border-t border-anthracite/10 bg-creme px-4 py-4 font-sans text-[length:var(--text-sm)] leading-relaxed text-anthracite/80">
                    {email.body}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
