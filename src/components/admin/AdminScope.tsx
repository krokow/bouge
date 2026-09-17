'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AvailabilityInput } from '@/lib/availability';
import { useDatabase } from '@/lib/hooks/useDatabase';
import type { DatabaseShape } from '@/lib/store/schema';
import type { Coach } from '@/lib/types';

/**
 * Périmètre de l'espace d'administration : qui consulte, et ce qu'il a le
 * droit de voir.
 *
 * ── La règle ────────────────────────────────────────────────────────────────
 * Le gérant voit tout le studio, et peut aussi se placer dans l'espace de
 * n'importe quel coach pour le gérer à sa place. Un coach ne voit que son
 * activité : ses séances, ses clients, ses recettes. Jamais celles des autres.
 *
 * ── Une distinction qui compte ──────────────────────────────────────────────
 * `data` est restreint au périmètre : c'est lui qui alimente les listes, les
 * statistiques et les exports. `availability` ne l'est PAS : le planning doit
 * rester exact. Un coach qui consulte son agenda doit voir qu'un créneau est
 * pris, même par un collègue — sinon il le proposerait à un client alors que
 * la salle est occupée. Ce qu'il ne voit pas, c'est l'identité du client et le
 * détail de la séance : c'est `canSeeBooking` qui tranche.
 *
 * ⚠️ DÉMO — ce filtrage est côté navigateur, donc contournable. En production
 * il doit être refait côté serveur à chaque requête : une API qui renvoie
 * toutes les réservations en laissant l'écran trier n'a rien protégé du tout.
 */
export interface AdminScope {
  /** Coach consulté. `null` : vue « tout le studio », réservée au gérant. */
  coach: Coach | null;
  /** Le compte connecté est-il le gérant du studio ? */
  isOwner: boolean;
  /** Données restreintes au périmètre : listes, statistiques, exports. */
  data: DatabaseShape;
  /** État complet, non filtré. À n'employer que pour l'exactitude du planning. */
  full: DatabaseShape;
  /** Entrée de calcul des disponibilités, toujours bâtie sur l'état complet. */
  availability: AvailabilityInput;
  /** Le détail de cette réservation est-il visible dans ce périmètre ? */
  canSeeBooking: (bookingId: string | undefined) => boolean;
}

const ScopeContext = createContext<AdminScope | null>(null);

export function AdminScopeProvider({
  coach,
  isOwner,
  children,
}: {
  coach: Coach | null;
  isOwner: boolean;
  children: ReactNode;
}) {
  const full = useDatabase();

  const value = useMemo<AdminScope>(() => {
    const availability: AvailabilityInput = {
      bookings: full.bookings,
      blocks: full.blocks,
      coaches: full.coaches,
      assignments: full.assignments,
    };

    if (!coach) {
      return { coach: null, isOwner, data: full, full, availability, canSeeBooking: () => true };
    }

    const bookings = full.bookings.filter((b) => b.coachId === coach.id);
    const visible = new Set(bookings.map((b) => b.id));

    // Les clients qui ne sont jamais venus chez ce coach n'ont pas à figurer
    // dans son espace. Le gérant reste dans la liste : c'est son studio.
    const clientIds = new Set(bookings.map((b) => b.userId));
    const users = full.users.filter((u) => u.role !== 'client' || clientIds.has(u.id));

    const data: DatabaseShape = {
      ...full,
      users,
      bookings,
      // Les fermetures du studio entier le concernent aussi : il doit les voir.
      blocks: full.blocks.filter((b) => !b.coachId || b.coachId === coach.id),
      // Une séance qu'il n'assure pas ne le regarde pas, et les courriels sans
      // réservation rattachée (bienvenue, etc.) relèvent du studio.
      emails: full.emails.filter((e) => e.bookingId && visible.has(e.bookingId)),
      // Les identifiants de connexion ne servent à aucun écran : on ne les
      // transporte pas dans le périmètre consulté.
      credentials: [],
    };

    return {
      coach,
      isOwner,
      data,
      full,
      availability,
      canSeeBooking: (id) => Boolean(id && visible.has(id)),
    };
  }, [full, coach, isOwner]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useAdminScope(): AdminScope {
  const scope = useContext(ScopeContext);
  if (!scope) throw new Error('useAdminScope doit être appelé dans un AdminScopeProvider.');
  return scope;
}

/** Raccourci : les données du périmètre consulté, comme `useDatabase()`. */
export function useAdminData(): DatabaseShape {
  return useAdminScope().data;
}
