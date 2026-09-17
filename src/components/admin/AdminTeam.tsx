'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormError, TextArea, TextField } from '@/components/ui/Field';
import { CoachAvatar } from '@/components/ui/CoachAvatar';
import { COLOR_CLASSES } from '@/lib/colors';
import { bookableCoaches } from '@/lib/coaches';
import { useAction } from '@/lib/hooks/useDatabase';
import { db } from '@/lib/store/database';
import { todayIso } from '@/lib/date';
import type { BrandColor, Coach } from '@/lib/types';
import { useAdminScope } from './AdminScope';

const COLORS: BrandColor[] = ['orange', 'jade', 'ciel', 'brun'];

/**
 * Gestion de l'équipe — réservée au gérant.
 *
 * Trois gestes possibles : ajouter un coach, le mettre en pause, le retirer.
 *
 * « Mettre en pause » (`active: false`) est volontairement mis en avant devant
 * la suppression : c'est ce qu'on veut dans la plupart des cas — un coach qui
 * s'absente quelques mois n'est plus proposé à la réservation, mais son
 * historique, ses statistiques et son accès restent intacts.
 *
 * La suppression, elle, est refusée tant qu'il reste des séances à venir :
 * sans ce garde-fou, des clients se présenteraient devant une porte sans
 * personne derrière. Le message dit combien de séances bloquent.
 */
export function AdminTeam({ onInspect }: { onInspect: (coach: Coach) => void }) {
  const { full, isOwner } = useAdminScope();
  const [adding, setAdding] = useState(false);

  const add = useAction(db.addCoach.bind(db));
  const remove = useAction(db.removeCoach.bind(db));
  const update = useAction(db.updateCoach.bind(db));

  if (!isOwner) return null;

  const coaches = bookableCoaches(full.coaches).concat(full.coaches.filter((c) => !c.active));
  const today = todayIso();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-[60ch] text-[length:var(--text-sm)] leading-relaxed text-anthracite/65">
          Les coachs actifs sont proposés au moment de réserver. Chacun dispose de son propre espace, où il ne voit
          que son activité — vous pouvez y entrer depuis «&nbsp;Espace consulté&nbsp;» pour gérer à sa place.
        </p>
        <Button size="sm" onClick={() => setAdding((v) => !v)}>
          {adding ? 'Annuler' : 'Ajouter un coach'}
        </Button>
      </div>

      {(add.error || remove.error) && <FormError>{add.error ?? remove.error}</FormError>}

      {adding && (
        <AddCoachForm
          pending={add.pending}
          onSubmit={async (values) => {
            const created = await add.run(values);
            if (created) setAdding(false);
          }}
        />
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {coaches.map((coach) => {
          const upcoming = full.bookings.filter(
            (b) => b.coachId === coach.id && b.status === 'confirmed' && b.date >= today,
          ).length;
          const total = full.bookings.filter((b) => b.coachId === coach.id).length;
          const tone = COLOR_CLASSES[coach.color];

          return (
            <li key={coach.id}>
              <article
                className={`flex h-full flex-col gap-3 rounded-2xl border bg-blanc p-4 ${
                  coach.active ? 'border-anthracite/10' : 'border-dashed border-anthracite/20 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <CoachAvatar coach={coach} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-[length:var(--text-xl)] leading-none">
                        {coach.firstName} {coach.lastName}
                      </span>
                      {coach.owner && (
                        <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] ${tone.solid}`}>
                          Gérant
                        </span>
                      )}
                      {!coach.active && (
                        <span className="rounded-full bg-anthracite/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-anthracite/55">
                          En pause
                        </span>
                      )}
                    </p>
                    <p className="text-[length:var(--text-xs)] text-anthracite/55">{coach.role}</p>
                  </div>
                </div>

                <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[length:var(--text-xs)] text-anthracite/60">
                  <div className="flex gap-1.5">
                    <dt>Séances à venir</dt>
                    <dd className="font-semibold text-anthracite">{upcoming}</dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt>Total</dt>
                    <dd className="font-semibold text-anthracite">{total}</dd>
                  </div>
                </dl>

                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <Button variant="dark" size="sm" onClick={() => onInspect(coach)}>
                    Ouvrir son espace
                  </Button>

                  {!coach.owner && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={update.pending}
                        onClick={() => void update.run(coach.id, { active: !coach.active })}
                        className="text-anthracite/65"
                      >
                        {coach.active ? 'Mettre en pause' : 'Réactiver'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={remove.pending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Retirer ${coach.firstName} ${coach.lastName} de l’équipe ? ` +
                                'Son accès sera fermé. Les séances déjà passées restent dans l’historique du studio.',
                            )
                          ) {
                            void remove.run(coach.id);
                          }
                        }}
                        className="text-orange-dark"
                      >
                        Retirer
                      </Button>
                    </>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AddCoachForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (values: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    bio: string;
    specialties: string[];
    color: BrandColor;
  }) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Coach sportif');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [color, setColor] = useState<BrandColor>('jade');

  const complete = firstName.trim() && lastName.trim() && email.trim() && password.length >= 8;

  return (
    <form
      className="flex flex-col gap-4 rounded-2xl border border-anthracite/10 bg-blanc p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          firstName,
          lastName,
          email,
          password,
          role,
          bio,
          specialties: specialties
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean),
          color,
        });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id="coach-firstname"
          label="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="off"
          required
        />
        <TextField
          id="coach-lastname"
          label="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          autoComplete="off"
          required
        />
        <TextField
          id="coach-email"
          label="Email de connexion"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          required
        />
        <TextField
          id="coach-password"
          label="Mot de passe provisoire"
          hint="Huit caractères minimum, à lui transmettre de vive voix."
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          minLength={8}
          required
        />
        <TextField
          id="coach-role"
          label="Intitulé"
          hint="Affiché sous son nom."
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <TextField
          id="coach-specialties"
          label="Spécialités"
          hint="Séparées par des virgules."
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          placeholder="Force, Mobilité, Cardio"
        />
      </div>

      <TextArea
        id="coach-bio"
        label="Présentation"
        hint="Deux phrases suffisent. Visible sur le site et au moment de réserver."
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
      />

      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="pb-1 text-[length:var(--text-2xs)] font-bold uppercase tracking-[0.14em] text-anthracite/45">
          Couleur de repérage
        </legend>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-pressed={color === c}
              aria-label={c}
              className={`size-9 rounded-full ${COLOR_CLASSES[c].dot} ${
                color === c ? 'ring-2 ring-anthracite ring-offset-2' : 'opacity-70 hover:opacity-100'
              }`}
            />
          ))}
        </div>
      </fieldset>

      <p className="text-[length:var(--text-xs)] leading-relaxed text-anthracite/55">
        Sans photo, ses initiales s’afficheront sur sa couleur. Déposez ensuite un portrait dans
        <code className="mx-1 rounded bg-anthracite/6 px-1.5 py-0.5">public/media/</code>
        et renseignez-le dans sa fiche.
      </p>

      <div className="flex justify-end">
        <Button type="submit" size="md" disabled={!complete || pending}>
          {pending ? 'Ajout…' : 'Ajouter à l’équipe'}
        </Button>
      </div>
    </form>
  );
}
