'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BookingCard } from './BookingCard';
import { RunCard } from '@/components/runs/RunCard';
import { ArrowRight, Button, ButtonLink } from '@/components/ui/Button';
import { Checkbox, TextField } from '@/components/ui/Field';
import { asset, STUDIO } from '@/lib/config';
import { toDateTime, todayIso } from '@/lib/date';
import { useCurrentUser, useDatabase, useMounted } from '@/lib/hooks/useDatabase';
import { bookingsToIcs, downloadIcs } from '@/lib/ics';
import { myUpcomingRuns, placesLeft } from '@/lib/runs';
import { db } from '@/lib/store/database';
import { ACCOUNT_HREF, BOOKING_HREF, LOGIN_HREF, workspaceFor } from '@/lib/nav';
import type { Booking } from '@/lib/types';

type Tab = 'upcoming' | 'history' | 'profile';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'upcoming', label: 'Mes séances' },
  { id: 'history', label: 'Historique' },
  { id: 'profile', label: 'Mon profil' },
];

export function AccountDashboard() {
  const router = useRouter();
  const state = useDatabase();
  const user = useCurrentUser();
  const mounted = useMounted();
  const [tab, setTab] = useState<Tab>('upcoming');

  // Page privée : sans session, on renvoie vers l'écran de connexion.
  //
  // Et l'espace client n'est pas celui d'un coach : corriger le lien de la
  // barre de navigation ne suffisait pas, il reste les liens en favori et les
  // adresses tapées à la main. Un coach qui arrive ici est renvoyé vers son
  // tableau de bord plutôt que de découvrir un espace client vide.
  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.replace(LOGIN_HREF);
      return;
    }
    const { href } = workspaceFor(user.role);
    if (href !== ACCOUNT_HREF) router.replace(href);
  }, [mounted, user, router]);

  const availability = useMemo(
    // Équipe, affectations et sorties comprises : c'est cette entrée qui
    // alimente le report d'une séance. Sans elles, le client pourrait déplacer
    // son rendez-vous sur un créneau où le coach est en sortie, ou sur un
    // créneau fermé pour ce coach-là seulement.
    () => ({
      bookings: state.bookings,
      blocks: state.blocks,
      coaches: state.coaches,
      assignments: state.assignments,
      runs: state.runs,
    }),
    [state.bookings, state.blocks, state.coaches, state.assignments, state.runs],
  );

  const { upcoming, history } = useMemo(() => {
    if (!user) return { upcoming: [] as Booking[], history: [] as Booking[] };
    const now = Date.now();
    const mine = state.bookings.filter((b) => b.userId === user.id);
    return {
      upcoming: mine
        .filter((b) => toDateTime(b.date, b.endTime).getTime() >= now && b.status !== 'cancelled')
        .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)),
      history: mine
        .filter((b) => toDateTime(b.date, b.endTime).getTime() < now || b.status === 'cancelled')
        .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`)),
    };
  }, [state.bookings, user]);

  if (!mounted || !user || workspaceFor(user.role).href !== ACCOUNT_HREF) {
    return <div className="h-96 animate-pulse rounded-[1.75rem] bg-anthracite/6" aria-hidden="true" />;
  }

  const completed = history.filter((b) => b.status === 'completed').length;

  return (
    <div className="flex flex-col gap-[var(--spacing-fluid-4)]">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={asset('/brand/mascotte-face-dark.webp')}
            alt=""
            width={512}
            height={405}
            className="h-14 w-auto sm:h-16"
          />
          <div className="flex flex-col gap-1">
            <p className="text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.18em] text-orange">
              Votre espace
            </p>
            <h1 className="text-[length:var(--text-4xl)]">Bonjour {user.firstName}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <ButtonLink href={BOOKING_HREF} size="sm">
            Réserver une séance <ArrowRight />
          </ButtonLink>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void db.signOut().then(() => router.push('/'))}
            className="text-anthracite/60"
          >
            Se déconnecter
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat value={String(upcoming.length)} label="séance à venir" plural="séances à venir" count={upcoming.length} />
        <Stat value={String(completed)} label="séance effectuée" plural="séances effectuées" count={completed} />
        <Stat value={String(user.marketingOptIn ? 'Oui' : 'Non')} label="inscrit aux actualités" count={1} />
      </div>

      <nav className="flex gap-1.5 overflow-x-auto rounded-full bg-anthracite/6 p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            aria-pressed={tab === item.id}
            className={[
              'min-h-11 flex-1 whitespace-nowrap rounded-full px-4 text-[length:var(--text-sm)] font-semibold transition-colors duration-300',
              tab === item.id ? 'bg-anthracite text-creme' : 'text-anthracite/60 hover:text-anthracite',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'upcoming' && (
        <section className="flex flex-col gap-4">
          {/* Les sorties collectives passent devant : elles sont gratuites et
              les places se rendent, mieux vaut que l'oubli se voie tout de
              suite. Elles n'apparaissent que si la personne en a réservé une. */}
          <MyRuns />

          {upcoming.length === 0 ? (
            <EmptyState
              title="Aucune séance prévue"
              text="Choisissez un créneau, il vous en reste plein de libres cette semaine."
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="sr-only">Séances à venir</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadIcs(bookingsToIcs(upcoming, state.users, 'BOUGE. — mes séances'), 'bouge-mes-seances')}
                  className="ml-auto text-anthracite/60"
                >
                  Exporter toutes mes séances (.ics)
                </Button>
              </div>
              <ul className="flex flex-col gap-4">
                {upcoming.map((booking) => (
                  <li key={booking.id}>
                    <BookingCard booking={booking} availability={availability} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {tab === 'history' && (
        <section className="flex flex-col gap-4">
          <h2 className="sr-only">Historique</h2>
          {history.length === 0 ? (
            <EmptyState title="Rien dans l’historique" text="Vos séances passées apparaîtront ici." />
          ) : (
            <ul className="flex flex-col gap-4">
              {history.slice(0, 30).map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} availability={availability} past />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'profile' && <ProfilePanel />}
    </div>
  );
}

/**
 * Les sorties collectives auxquelles la personne est inscrite.
 *
 * Même carte que sur le site public : elle porte déjà le bouton de
 * désinscription, la date et le point de rendez-vous. Rien à réécrire.
 */
function MyRuns() {
  const user = useCurrentUser();
  const state = useDatabase();

  const mine = useMemo(
    () => myUpcomingRuns(state.runs, state.runSignups, user?.id),
    [state.runs, state.runSignups, user?.id],
  );

  if (mine.length === 0) return null;

  return (
    <section id="mes-sorties" aria-labelledby="mes-sorties-titre" className="flex flex-col gap-3">
      <h2 id="mes-sorties-titre" className="text-[length:var(--text-xl)]">
        {mine.length > 1 ? 'Vos prochaines sorties' : 'Votre prochaine sortie'}
      </h2>
      <ul className="flex flex-col gap-3">
        {mine.map((run) => (
          <li key={run.id}>
            <RunCard run={run} left={placesLeft(run, state.runSignups)} mine />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ value, label, plural, count }: { value: string; label: string; plural?: string; count: number }) {
  return (
    <div className="u-card flex items-baseline gap-3 p-4 sm:flex-col sm:gap-1 sm:p-5">
      <span className="font-display text-[length:var(--text-3xl)] leading-none text-orange">{value}</span>
      <span className="text-[length:var(--text-sm)] text-anthracite/60">
        {count > 1 && plural ? plural : label}
      </span>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="u-card flex flex-col items-center gap-3 p-8 text-center sm:p-12">
      <img
        src={asset('/brand/mascotte-run-dark.webp')}
        alt=""
        width={760}
        height={640}
        className="u-float h-24 w-auto opacity-70"
      />
      <h3 className="text-[length:var(--text-2xl)]">{title}</h3>
      <p className="max-w-[40ch] text-anthracite/60">{text}</p>
      <ButtonLink href={BOOKING_HREF} size="md" className="mt-2">
        Voir les créneaux <ArrowRight />
      </ButtonLink>
    </div>
  );
}

function ProfilePanel() {
  const user = useCurrentUser();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    marketingOptIn: user?.marketingOptIn ?? false,
  }));

  if (!user) return null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          await db.updateProfile(user.id, form);
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2600);
        }}
        className="u-card flex flex-col gap-4 p-6"
      >
        <h2 className="text-[length:var(--text-2xl)]">Mes informations</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="profile-firstname"
            label="Prénom"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <TextField
            id="profile-lastname"
            label="Nom"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
        <TextField id="profile-email" label="Email" value={user.email} disabled readOnly hint="non modifiable" />
        <TextField
          id="profile-phone"
          label="Téléphone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Checkbox
          id="profile-optin"
          checked={form.marketingOptIn}
          onChange={(e) => setForm({ ...form, marketingOptIn: e.target.checked })}
        >
          Recevoir les actualités du studio.
        </Checkbox>

        <div className="flex items-center gap-3">
          <Button type="submit" size="md">
            Enregistrer
          </Button>
          {saved && (
            <span role="status" className="text-[length:var(--text-sm)] font-semibold text-jade">
              Modifications enregistrées.
            </span>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-4">
        <div className="u-card flex flex-col gap-3 p-6">
          <h2 className="text-[length:var(--text-2xl)]">Vos données</h2>
          <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">
            Conformément au RGPD, vous pouvez à tout moment récupérer vos données ou supprimer votre compte. La
            suppression efface votre profil et l’historique de vos réservations, sans possibilité de retour.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="dark"
              size="sm"
              onClick={() => {
                const payload = JSON.stringify({ profil: user }, null, 2);
                const blob = new Blob([payload], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'mes-donnees-bouge.json';
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="sm:flex-1"
            >
              Télécharger mes données
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="text-orange-dark sm:flex-1"
            >
              Supprimer mon compte
            </Button>
          </div>

          {confirmDelete && (
            <div className="flex flex-col gap-3 rounded-2xl border-2 border-orange/45 bg-orange/8 p-4">
              <p className="text-[length:var(--text-sm)] leading-relaxed">
                Cette action est définitive. Vos réservations à venir seront annulées.
              </p>
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button
                  size="sm"
                  onClick={() => void db.deleteAccount(user.id).then(() => router.push('/'))}
                  className="sm:flex-1"
                >
                  Confirmer la suppression
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} className="sm:flex-1">
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="u-card flex flex-col gap-2 p-6">
          <h2 className="text-[length:var(--text-xl)]">Une question ?</h2>
          <p className="text-[length:var(--text-sm)] leading-relaxed text-anthracite/70">
            Pour toute demande urgente — notamment une annulation à moins de 24&nbsp;h — appelez directement le
            studio.
          </p>
          <a href={`tel:${STUDIO.phoneHref}`} className="font-display text-[length:var(--text-2xl)] text-orange no-underline">
            {STUDIO.phone}
          </a>
          <p className="text-[length:var(--text-2xs)] text-anthracite/45">Membre depuis le {todayIso() && new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </section>
  );
}
