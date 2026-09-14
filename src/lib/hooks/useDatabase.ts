'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { db } from '@/lib/store/database';
import type { DatabaseShape } from '@/lib/store/schema';
import type { User } from '@/lib/types';

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
