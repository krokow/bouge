'use client';

import { useState } from 'react';
import { ArrowRight, Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Field';
import { SignInForm, SignUpForm } from '@/components/booking/steps/CheckoutSteps';
import { formatLongDate, formatTime } from '@/lib/date';
import { useAction, useCurrentUser } from '@/lib/hooks/useDatabase';
import { db } from '@/lib/store/database';
import type { SocialRun } from '@/lib/types';

/**
 * Une sortie collective, avec son inscription.
 *
 * L'inscription se fait sur place, sans quitter la page : le tunnel de
 * réservation n'aurait aucun sens ici — pas de formule à choisir, pas de
 * créneau, pas de paiement. Il ne reste qu'une chose à faire, prendre sa
 * place, et il serait absurde de la faire précéder de six écrans.
 *
 * Le compte reste obligatoire, comme pour une séance : c'est ce qui permet au
 * studio de prévenir en cas d'annulation, d'envoyer le rappel de la veille, et
 * à la personne de se désinscrire seule. Les formulaires sont ceux du tunnel,
 * réutilisés tels quels.
 */
export function RunCard({
  run,
  left,
  mine,
  tone = 'light',
}: {
  run: SocialRun;
  /** Places restantes. */
  left: number;
  /** La personne connectée est-elle déjà inscrite ? */
  mine: boolean;
  tone?: 'light' | 'dark';
}) {
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);

  const join = useAction(db.joinRun.bind(db));
  const leave = useAction(db.leaveRun.bind(db));

  const full = left === 0;
  const dark = tone === 'dark';

  return (
    <article
      className={[
        'flex h-full flex-col gap-4 rounded-[1.5rem] p-5 sm:p-6',
        dark ? 'border border-creme/15 bg-anthracite-800 text-creme' : 'u-card',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p
            className={`text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.16em] ${
              dark ? 'text-orange' : 'text-orange-dark'
            }`}
          >
            {formatLongDate(run.date)}
          </p>
          <h3 className="text-[length:var(--text-2xl)] leading-none">{run.title}</h3>
          <p className={`text-[length:var(--text-sm)] ${dark ? 'text-creme/65' : 'text-anthracite/60'}`}>
            {formatTime(run.startTime)} — {formatTime(run.endTime)} · {run.meetingPoint}
          </p>
        </div>

        <Places left={left} capacity={run.capacity} dark={dark} />
      </div>

      {run.description && (
        <p className={`text-[length:var(--text-sm)] leading-relaxed ${dark ? 'text-creme/75' : 'text-anthracite/70'}`}>
          {run.description}
        </p>
      )}

      {(join.error || leave.error) && <FormError>{join.error ?? leave.error}</FormError>}

      <div className="mt-auto flex flex-col gap-3 pt-1">
        {mine ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="flex items-center gap-2 text-[length:var(--text-sm)] font-semibold text-jade">
              <CheckIcon />
              Vous y êtes inscrit
            </p>
            <button
              type="button"
              disabled={leave.pending}
              onClick={() => user && void leave.run(run.id, user.id)}
              className={`text-[length:var(--text-sm)] underline-offset-4 hover:underline ${
                dark ? 'text-creme/55 hover:text-creme' : 'text-anthracite/55 hover:text-anthracite'
              }`}
            >
              {leave.pending ? 'Annulation…' : 'Me désinscrire'}
            </button>
          </div>
        ) : full ? (
          <p className={`text-[length:var(--text-sm)] font-semibold ${dark ? 'text-creme/60' : 'text-anthracite/55'}`}>
            Complet — guettez la prochaine date.
          </p>
        ) : user ? (
          <Button
            size="md"
            variant={dark ? 'cream' : 'primary'}
            disabled={join.pending}
            onClick={() => void join.run(run.id, user.id)}
          >
            {join.pending ? 'Inscription…' : 'Je prends ma place'}
            {!join.pending && <ArrowRight />}
          </Button>
        ) : !open ? (
          <Button size="md" variant={dark ? 'cream' : 'primary'} onClick={() => setOpen(true)}>
            Je prends ma place <ArrowRight />
          </Button>
        ) : (
          /* Le formulaire s'affiche à la demande : des champs déroulés d'emblée
             sous chaque sortie noieraient les dates, qui sont l'information que
             le visiteur est venu chercher. */
          <div className={`flex flex-col gap-4 rounded-2xl p-4 ${dark ? 'bg-anthracite-900' : 'bg-creme'}`}>
            <p className={`text-[length:var(--text-sm)] ${dark ? 'text-creme/75' : 'text-anthracite/70'}`}>
              C’est gratuit. Un compte suffit — il nous sert à vous prévenir si la sortie est annulée et à vous
              laisser vous désinscrire seul.
            </p>
            <AuthTabs dark={dark} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`self-start text-[length:var(--text-sm)] underline-offset-4 hover:underline ${
                dark ? 'text-creme/55' : 'text-anthracite/55'
              }`}
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/** Onglets « créer un compte » / « j'ai déjà un compte », repris du tunnel. */
function AuthTabs({ dark }: { dark: boolean }) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  return (
    <div className={`flex flex-col gap-4 ${dark ? '[&_span]:text-creme/70' : ''}`}>
      <div className={`flex gap-1.5 rounded-full p-1.5 ${dark ? 'bg-creme/10' : 'bg-anthracite/6'}`}>
        {(
          [
            { id: 'signup', label: 'Créer un compte' },
            { id: 'signin', label: 'J’ai déjà un compte' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            aria-pressed={mode === tab.id}
            className={[
              'min-h-11 flex-1 rounded-full px-3 text-[length:var(--text-sm)] font-semibold transition-colors duration-300',
              mode === tab.id
                ? dark
                  ? 'bg-creme text-anthracite'
                  : 'bg-anthracite text-creme'
                : dark
                  ? 'text-creme/60 hover:text-creme'
                  : 'text-anthracite/60 hover:text-anthracite',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {mode === 'signup' ? <SignUpForm /> : <SignInForm />}
    </div>
  );
}

/**
 * Places restantes.
 *
 * Le chiffre est mis en avant parce qu'il décide : « il reste 2 places » fait
 * agir, « 8/10 inscrits » demande une soustraction.
 */
function Places({ left, capacity, dark }: { left: number; capacity: number; dark: boolean }) {
  const urgent = left > 0 && left <= 3;
  return (
    <p
      className={[
        'flex shrink-0 flex-col items-end rounded-xl px-3 py-1.5 text-right',
        left === 0
          ? dark
            ? 'bg-creme/10 text-creme/55'
            : 'bg-anthracite/8 text-anthracite/50'
          : urgent
            ? 'bg-orange/15 text-orange-dark'
            : dark
              ? 'bg-jade/25 text-creme'
              : 'bg-jade/15 text-jade-dark',
      ].join(' ')}
    >
      <span className="font-display text-[length:var(--text-xl)] leading-none">{left === 0 ? 'Complet' : left}</span>
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] opacity-80">
        {left === 0 ? `${capacity} inscrits` : left > 1 ? 'places libres' : 'place libre'}
      </span>
    </p>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-4" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
