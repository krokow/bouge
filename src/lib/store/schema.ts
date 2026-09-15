import type { Block, Booking, Credential, EmailMessage, Session, User } from '@/lib/types';

/**
 * Forme complète de la « base » de démonstration.
 *
 * MIGRATION : chaque tableau correspond à une table. Le jour de la bascule vers
 * un vrai backend, la structure envoyée par l'API doit être identique — seul
 * l'adaptateur (localStorage → HTTP) change, pas les composants.
 */
export interface DatabaseShape {
  /** Incrémenté quand la forme change : purge automatique des anciens états. */
  version: number;
  users: User[];
  credentials: Credential[];
  bookings: Booking[];
  blocks: Block[];
  emails: EmailMessage[];
  session: Session | null;
}

export const DB_VERSION = 4;
export const DB_STORAGE_KEY = 'bouge.db.v4';

export function emptyDatabase(): DatabaseShape {
  return {
    version: DB_VERSION,
    users: [],
    credentials: [],
    bookings: [],
    blocks: [],
    emails: [],
    session: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Identifiants                                                                */
/* -------------------------------------------------------------------------- */

/** Identifiant opaque. En production : un UUID généré par la base. */
export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

/** Référence lisible transmise au client : « BG-7K2M ». */
export function newReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1 : illisibles à l'oral
  let out = '';
  for (let i = 0; i < 4; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `BG-${out}`;
}

/* -------------------------------------------------------------------------- */
/* Mots de passe                                                               */
/* -------------------------------------------------------------------------- */

/**
 * ⚠️ DÉMO UNIQUEMENT — ce n'est PAS du hachage de mot de passe.
 *
 * Il s'agit d'un condensé FNV-1a, non cryptographique, calculé dans le
 * navigateur, dont le seul rôle est d'éviter d'écrire les mots de passe en clair
 * dans le localStorage pendant la démonstration.
 *
 * En production : le mot de passe est envoyé en HTTPS au serveur, haché avec
 * Argon2id (ou bcrypt coût ≥ 12) côté serveur uniquement, et la session est
 * portée par un cookie httpOnly + Secure + SameSite=Lax.
 */
export function digestPassword(password: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < password.length; i += 1) {
    hash ^= password.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `demo$${hash.toString(36)}$${password.length}`;
}

export type { Block, Booking, Credential, EmailMessage, Session, User };
