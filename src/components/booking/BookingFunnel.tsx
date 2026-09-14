'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Stepper, type StepDefinition } from './Stepper';
import { BookingSummary, BookingSummaryBar, totalCents } from './BookingSummary';
import { OfferStep, ParticipantsStep, offersFor } from './steps/ChoiceSteps';
import { DateStep, TimeStep } from './steps/ScheduleSteps';
import {
  AuthStep,
  ConfirmationStep,
  EMPTY_CARD,
  PaymentStep,
  isCardComplete,
  type CardDraft,
} from './steps/CheckoutSteps';
import { ArrowRight, Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/Field';
import { bookingHorizonEnd, firstAvailableDate } from '@/lib/availability';
import { useAction, useCurrentUser, useDatabase, useMounted } from '@/lib/hooks/useDatabase';
import { db } from '@/lib/store/database';
import type { Booking, IsoDate, OfferId, PaymentMethod, Time } from '@/lib/types';

const STEPS: StepDefinition[] = [
  { id: 'participants', label: 'Participants', shortLabel: 'Qui' },
  { id: 'offer', label: 'Formule', shortLabel: 'Formule' },
  { id: 'date', label: 'Date', shortLabel: 'Date' },
  { id: 'time', label: 'Créneau', shortLabel: 'Heure' },
  { id: 'auth', label: 'Vos informations', shortLabel: 'Infos' },
  { id: 'payment', label: 'Paiement', shortLabel: 'Paiement' },
  { id: 'confirmation', label: 'Confirmation', shortLabel: 'Terminé' },
];

const STEP_TITLES = [
  { title: 'Vous venez à combien ?', intro: 'Trois personnes maximum par séance — jamais plus.' },
  { title: 'Quelle formule ?', intro: 'Seules les formules compatibles avec votre groupe sont affichées.' },
  { title: 'Quel jour ?', intro: 'Les créneaux affichés sont réellement libres, en direct.' },
  { title: 'Quelle heure ?', intro: 'Choisissez le moment qui vous arrange le mieux.' },
  { title: 'Qui êtes-vous ?', intro: 'Un compte permet de reporter ou annuler votre séance en autonomie.' },
  { title: 'Comment réglez-vous ?', intro: 'Sur place le jour J, ou en ligne maintenant. Au choix.' },
  { title: 'Séance confirmée', intro: '' },
];

export function BookingFunnel() {
  const params = useSearchParams();
  const state = useDatabase();
  const user = useCurrentUser();
  const mounted = useMounted();

  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [participants, setParticipants] = useState(1);
  const [offerId, setOfferId] = useState<OfferId | null>(null);
  const [date, setDate] = useState<IsoDate | null>(null);
  const [startTime, setStartTime] = useState<Time | null>(null);
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [card, setCard] = useState<CardDraft>(EMPTY_CARD);
  const [booking, setBooking] = useState<Booking | null>(null);

  const topRef = useRef<HTMLDivElement>(null);
  const prefillApplied = useRef(false);

  // Nouvelle identité seulement quand les données changent réellement :
  // évite de recalculer les créneaux à chaque rendu.
  const availability = useMemo(
    () => ({ bookings: state.bookings, blocks: state.blocks }),
    [state.bookings, state.blocks],
  );
  const maxDate = useMemo(() => bookingHorizonEnd(), []);

  const { run: submit, pending, error } = useAction(db.createBooking.bind(db));

  /* --- Pré-sélection depuis « /reserver/?offre=individuel » --------------- */
  useEffect(() => {
    if (prefillApplied.current || !mounted) return;
    const requested = params?.get('offre') as OfferId | null;
    if (!requested) {
      prefillApplied.current = true;
      return;
    }
    const matching = [1, 2, 3].find((count) => offersFor(count).some((o) => o.id === requested));
    if (matching) {
      prefillApplied.current = true;
      setParticipants(matching);
      setOfferId(requested);
      // On ouvre directement le calendrier : les deux premières étapes restent
      // accessibles d'un clic dans le fil d'étapes si l'on veut les changer.
      setStep(2);
      setFurthest(2);
    } else {
      prefillApplied.current = true;
    }
  }, [params, mounted]);

  /* --- Cohérence du brouillon -------------------------------------------- */
  // Changer le nombre de participants peut rendre la formule choisie invalide.
  useEffect(() => {
    if (offerId && !offersFor(participants).some((o) => o.id === offerId)) {
      setOfferId(null);
    }
    setGuestNames((names) => names.slice(0, Math.max(0, participants - 1)));
  }, [participants, offerId]);

  // Changer de date invalide l'horaire déjà choisi.
  useEffect(() => {
    setStartTime(null);
  }, [date]);

  const canContinue = (() => {
    switch (step) {
      case 0:
        return participants >= 1;
      case 1:
        return offerId !== null;
      case 2:
        return date !== null;
      case 3:
        return startTime !== null;
      case 4:
        return user !== null;
      case 5:
        return paymentMethod === 'onsite' || (paymentMethod === 'online' && isCardComplete(card));
      default:
        return false;
    }
  })();

  const goTo = (index: number) => {
    setStep(index);
    setFurthest((value) => Math.max(value, index));
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const handleNext = async () => {
    if (step < 5) {
      // En arrivant sur le calendrier, on propose d'emblée la prochaine date
      // réellement disponible : une étape de moins pour l'utilisateur.
      if (step === 1 && !date) {
        setDate(firstAvailableDate(availability));
      }
      goTo(step + 1);
      return;
    }

    if (!offerId || !date || !startTime || !user || !paymentMethod) return;
    const created = await submit({
      userId: user.id,
      offerId,
      participants,
      date,
      startTime,
      paymentMethod,
      cardLast4: paymentMethod === 'online' ? card.number.replace(/\s/g, '').slice(-4) : undefined,
      guestNames: guestNames.filter(Boolean),
      notes,
    });
    if (created) {
      setBooking(created);
      goTo(6);
    }
  };

  const summary = { participants, offerId, date, startTime };

  // Le rendu statique ne connaît pas encore la session : on attend l'hydratation
  // pour éviter toute divergence entre le HTML généré et le DOM.
  if (!mounted) {
    return <FunnelSkeleton />;
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <div className="grid items-start gap-[var(--spacing-fluid-4)] lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          {booking === null && (
            <Stepper steps={STEPS} current={step} furthest={furthest} onSelect={goTo} />
          )}

          <header className="flex flex-col gap-1.5">
            <h1 className="text-[length:var(--text-4xl)]">{STEP_TITLES[step].title}</h1>
            {STEP_TITLES[step].intro && (
              <p className="max-w-[54ch] text-[length:var(--text-base)] text-anthracite/65">
                {STEP_TITLES[step].intro}
              </p>
            )}
          </header>

          {error && <FormError>{error}</FormError>}

          <div key={step} style={{ animation: 'u-fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
            {step === 0 && <ParticipantsStep value={participants} onChange={setParticipants} />}
            {step === 1 && <OfferStep participants={participants} value={offerId} onChange={setOfferId} />}
            {step === 2 && (
              <DateStep value={date} onSelect={setDate} availability={availability} maxDate={maxDate} />
            )}
            {step === 3 && date && (
              <TimeStep date={date} value={startTime} onSelect={setStartTime} availability={availability} />
            )}
            {step === 4 && (
              <AuthStep
                user={user}
                participants={participants}
                guestNames={guestNames}
                notes={notes}
                onGuestNamesChange={setGuestNames}
                onNotesChange={setNotes}
              />
            )}
            {step === 5 && (
              <PaymentStep
                method={paymentMethod}
                onMethodChange={setPaymentMethod}
                card={card}
                onCardChange={setCard}
                amountCents={totalCents(summary)}
              />
            )}
            {step === 6 && booking && user && <ConfirmationStep booking={booking} user={user} />}
          </div>

          {/* Navigation — masquée sur l'écran de confirmation */}
          {step < 6 && (
            <div className="flex flex-col-reverse gap-3 border-t border-anthracite/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="ghost"
                size="md"
                onClick={() => goTo(Math.max(0, step - 1))}
                disabled={step === 0}
                className="text-anthracite/65"
              >
                Retour
              </Button>
              <Button size="lg" onClick={() => void handleNext()} disabled={!canContinue || pending} className="sm:min-w-56">
                {pending
                  ? 'Validation…'
                  : step === 5
                    ? paymentMethod === 'online'
                      ? 'Payer et confirmer'
                      : 'Confirmer la réservation'
                    : 'Continuer'}
                {!pending && <ArrowRight />}
              </Button>
            </div>
          )}
        </div>

        {booking === null && <BookingSummary data={summary} />}
      </div>

      {/* Barre récapitulative mobile ; l'espace réservé plus bas évite qu'elle
          ne recouvre les boutons de navigation. */}
      {booking === null && (
        <>
          <div aria-hidden="true" className="h-20 lg:hidden" />
          <BookingSummaryBar data={summary} />
        </>
      )}
    </div>
  );
}

/** Gabarit affiché pendant l'hydratation : même gabarit, aucun saut de mise en page. */
export function FunnelSkeleton() {
  return (
    <div className="grid items-start gap-[var(--spacing-fluid-4)] lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6" aria-hidden="true">
        <div className="h-1 w-full rounded-full bg-anthracite/10" />
        <div className="h-10 w-2/3 rounded-xl bg-anthracite/8" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-52 rounded-[1.5rem] bg-anthracite/6" />
          ))}
        </div>
      </div>
      <div className="hidden h-80 rounded-[1.5rem] bg-anthracite/6 lg:block" />
      <span className="sr-only">Chargement du tunnel de réservation…</span>
    </div>
  );
}
