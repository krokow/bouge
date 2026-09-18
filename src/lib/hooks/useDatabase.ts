'use client';

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { db } from '@/lib/store/database';
import type { DatabaseShape } from '@/lib/store/schema';
import { bookableCoaches, coachById } from '@/lib/coaches';
import { isSignedUp, placesLeft, upcomingRuns } from '@/lib/runs';
import type { Coach, SocialRun, User } from '@/lib/types';

/**
 * Accès réactif à la base de démonstration.
 *
 * `useSyncExternalStore` garantit que tous les écrans (tunnel de réservation,
 * espace client, tableau de bord) voient exactement le même état, sans
 * contexte React ni gestionnaire d'état externe.
 *
 * L'instantané serveur est volontairement vide : en export statique le HTML est
 * généré sans données, l'hydratation les charge ensuite depuis le navigateur.
 */
export function useDatabase(): DatabaseShape {
  return useSyncExternalStore(db.subscribe, db.getSnapshot, db.getServerSnapshot);
}

export function useCurrentUser(): User | null {
  const state = useDatabase();
  if (!state.session) return null;
  if (new Date(state.session.expiresAt).getTime() < Date.now()) return null;
  return state.users.find((u) => u.id === state.session!.userId) ?? null;
}

export function useIsAdmin(): boolean {
  return useCurrentUser()?.role === 'admin';
}

/** L'équipe au complet, coachs désactivés compris. */
export function useCoaches(): Coach[] {
  return useDatabase().coaches;
}

/** Coachs proposables à la réservation, titulaire en tête. */
export function useBookableCoaches(): Coach[] {
  const coaches = useCoaches();
  return useMemo(() => bookableCoaches(coaches), [coaches]);
}

/**
 * Fiche du coach correspondant au compte connecté.
 *
 * Le gérant en a une (il coache aussi) ; un client n'en a pas.
 */
export function useCurrentCoach(): Coach | null {
  const user = useCurrentUser();
  const coaches = useCoaches();
  if (!user) return null;
  return coaches.find((c) => c.userId === user.id) ?? null;
}

/** Retrouve un coach par son identifiant, sans recharger toute la liste. */
export function useCoach(coachId: string | undefined): Coach | undefined {
  return coachById(useCoaches(), coachId);
}

/* -------------------------------------------------------------------------- */
/* Runs                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Sorties collectives à venir, avec ce qu'il faut pour les afficher.
 *
 * Le décompte des places et l'état « déjà inscrit » sont calculés ici plutôt
 * que dans chaque composant : trois écrans les affichent, et ils doivent dire
 * la même chose.
 */
export function useUpcomingRuns(): Array<{ run: SocialRun; left: number; mine: boolean }> {
  const state = useDatabase();
  const user = useCurrentUser();
  return useMemo(
    () =>
      upcomingRuns(state.runs).map((run) => ({
        run,
        left: placesLeft(run, state.runSignups),
        mine: isSignedUp(state.runSignups, run.id, user?.id),
      })),
    [state.runs, state.runSignups, user?.id],
  );
}

/**
 * `true` une fois le composant monté côté navigateur.
 * Sert à ne rendre les contenus dépendants du stockage local qu'après
 * hydratation, pour éviter toute divergence entre le HTML statique et le DOM.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Enveloppe une action asynchrone avec état de chargement et message d'erreur. */
export function useAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
): {
  run: (...args: Args) => Promise<Result | undefined>;
  pending: boolean;
  error: string | null;
  clearError: () => void;
} {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: Args) => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  return { run, pending, error, clearError: () => setError(null) };
}
