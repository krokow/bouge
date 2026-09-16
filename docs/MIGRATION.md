# Passer de la démonstration à la production

Le site actuel est **entièrement statique** : aucun serveur, aucune base de
données. Les comptes, réservations et paiements sont simulés dans le navigateur
du visiteur (`localStorage`). C'est suffisant pour valider le parcours et le
design avec le client, mais il faut évidemment un vrai back-end avant
l'ouverture.

Ce document explique **exactement** ce qu'il reste à brancher. Le code a été
écrit pour que cette étape soit une substitution, pas une réécriture.

---

## 1. Ce qui est déjà prêt

| Élément | État | Où |
|---|---|---|
| Modèle de données | Complet et typé | `src/lib/types.ts` |
| Règles de planning | Pures, réutilisables côté serveur | `src/lib/availability.ts` |
| Calculs de statistiques | Purs, traduisibles en SQL | `src/lib/stats.ts` |
| Export iCalendar | Conforme RFC 5545 | `src/lib/ics.ts` |
| Interface (toutes les pages) | Terminée | `src/app/`, `src/components/` |
| Accès aux données | **À remplacer** | `src/lib/store/database.ts` |

---

## 2. Le seul fichier à réécrire

`src/lib/store/database.ts` expose une classe dont **toutes les méthodes sont
déjà `async`**, alors que rien ne l'imposait techniquement. C'était le but :
les composants font déjà `await`, ils n'ont donc aucune modification à subir.

| Méthode actuelle | Route API à créer |
|---|---|
| `signUp(input)` | `POST /api/auth/register` |
| `signIn(email, password)` | `POST /api/auth/login` |
| `signOut()` | `POST /api/auth/logout` |
| `currentUser()` | `GET /api/auth/me` |
| `updateProfile(id, patch)` | `PATCH /api/users/:id` |
| `deleteAccount(id)` | `DELETE /api/users/:id` |
| `createBooking(input)` | `POST /api/bookings` |
| `cancelBooking(id, by)` | `POST /api/bookings/:id/cancel` |
| `rescheduleBooking(id, d, t)` | `POST /api/bookings/:id/reschedule` |
| `setBookingStatus(id, s)` | `PATCH /api/bookings/:id` |
| `setPaymentStatus(id, s)` | `PATCH /api/bookings/:id/payment` |
| `createBlock(input)` | `POST /api/blocks` |
| `deleteBlock(id)` | `DELETE /api/blocks/:id` |

Les fichiers `src/lib/store/seed.ts` (données de démonstration) et
`src/lib/store/schema.ts` (stockage navigateur) disparaissent à ce moment-là.

---

## 3. Schéma de base de données

Chaque interface de `src/lib/types.ts` correspond à une table. En PostgreSQL :

```sql
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE NOT NULL,
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  phone         text,
  role          text NOT NULL DEFAULT 'client' CHECK (role IN ('client','admin')),
  marketing_opt_in boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE credentials (
  user_id         uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash   text NOT NULL   -- Argon2id, calculé côté serveur uniquement
);

CREATE TABLE bookings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference      text UNIQUE NOT NULL,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  offer_id       text NOT NULL,
  participants   smallint NOT NULL CHECK (participants BETWEEN 1 AND 3),
  date           date NOT NULL,
  start_time     time NOT NULL,
  end_time       time NOT NULL,
  status         text NOT NULL CHECK (status IN ('confirmed','cancelled','completed','no_show')),
  payment_method text NOT NULL CHECK (payment_method IN ('onsite','online')),
  payment_status text NOT NULL CHECK (payment_status IN ('pending','paid','refunded')),
  amount_cents   integer NOT NULL,
  card_last4     char(4),
  provider_ref   text,              -- identifiant Stripe (pi_...)
  guest_names    text[] NOT NULL DEFAULT '{}',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  cancelled_at   timestamptz,
  cancelled_by   text
);

-- Le studio n'a qu'un coach : un seul rendez-vous actif par créneau.
-- Cette contrainte est la véritable protection contre la double réservation.
CREATE UNIQUE INDEX bookings_one_per_slot
  ON bookings (date, start_time)
  WHERE status <> 'cancelled';

CREATE TABLE blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type        text NOT NULL CHECK (type IN ('day','week','range','slot')),
  start_date  date NOT NULL,
  end_date    date NOT NULL,
  start_time  time,
  end_time    time,
  reason      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
```

> **Point important.** Dans la démonstration, la vérification « ce créneau
> est-il encore libre ? » est faite en JavaScript. En production elle doit être
> faite par la base : c'est l'index unique ci-dessus qui empêche réellement deux
> clients de réserver le même créneau à la même seconde. Le code applicatif ne
> peut pas garantir cela.

---

## 4. Points de sécurité à traiter impérativement

La démonstration prend volontairement des raccourcis. Aucun ne doit survivre.

1. **Mots de passe.** `digestPassword()` (`src/lib/store/schema.ts`) n'est PAS
   du hachage sécurisé : c'est un condensé non cryptographique calculé dans le
   navigateur, uniquement pour éviter d'écrire les mots de passe en clair
   pendant la démo. En production : Argon2id côté serveur, jamais côté client.

2. **Sessions.** Remplacer la session stockée dans `localStorage` par un cookie
   `httpOnly` + `Secure` + `SameSite=Lax`, signé côté serveur.

3. **Accès administrateur.** Le contrôle dans `AdminShell.tsx` est purement
   visuel : n'importe qui peut le contourner. Chaque route API d'administration
   doit vérifier la session ET le rôle, côté serveur.

4. **Paiement.** L'écran de carte bancaire est une maquette. Utiliser Stripe
   Elements ou Checkout : les numéros de carte ne doivent jamais toucher le
   serveur du studio. Ne conserver que `payment_intent` et les quatre derniers
   chiffres.

5. **Emails.** Les messages sont écrits dans une boîte d'envoi locale visible
   dans l'espace gérant. Les brancher sur un service transactionnel (Brevo,
   Postmark, SES). Le rappel de la veille demande une tâche planifiée côté
   serveur.

6. **Formulaires publics** (contact, alerte ostéopathie). Ajouter une limitation
   de débit côté serveur.

---

## 5. Hébergement OVH

Deux scénarios, selon ce que le studio veut faire.

### A. Rester en statique (le plus simple)

Si la réservation en ligne peut attendre, le site actuel se dépose tel quel sur
un hébergement mutualisé :

```bash
NEXT_PUBLIC_BASE_PATH="" npm run build   # domaine dédié → pas de préfixe
# puis envoyer le contenu de out/ dans www/ par FTP/SFTP
```

Ajouter dans `www/.htaccess` :

```apache
# Servir la page d'erreur du site plutôt que celle d'Apache
ErrorDocument 404 /404.html

# Mise en cache longue des ressources versionnées par le build
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType video/mp4  "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

Dans ce cas, la réservation reste une démonstration : il faut alors retirer le
tunnel et renvoyer vers le téléphone, sous peine de promettre au visiteur une
réservation qui n'existe pas.

### B. Site complet avec back-end (recommandé à l'ouverture)

Un VPS OVH avec Node 22, PostgreSQL et un reverse-proxy :

1. retirer `output: 'export'` de `next.config.mjs` ;
2. créer les routes API listées en section 2 ;
3. `npm run build && npm start` derrière Nginx ;
4. certificat TLS via Let's Encrypt ;
5. sauvegarde quotidienne chiffrée de la base.

---

## 6. Brancher le vrai flux Instagram

Le site affiche aujourd'hui le compte
[@melvinmaillot](https://www.instagram.com/melvinmaillot/) sous forme de liens
et d'une grille de publications choisies à la main
(`src/lib/instagram.ts`). Aucun appel n'est fait vers Instagram : le visiteur
ne communique avec ce réseau que s'il clique.

### Pourquoi ce n'est pas branché en direct dès maintenant

| Obstacle | Détail |
|---|---|
| L'API simple n'existe plus | L'*Instagram Basic Display API*, qui lisait un compte personnel avec un simple jeton, a été arrêtée par Meta le **4 décembre 2024**. |
| La remplaçante est exigeante | L'*Instagram API with Instagram Login* (Graph API) impose un **compte professionnel** — créateur ou entreprise —, une application déclarée chez Meta, et un jeton à renouveler **tous les soixante jours**. |
| Un site statique ne peut pas garder un secret | Tout ce que contient le site exporté est lisible par n'importe quel visiteur. Le jeton doit donc vivre côté serveur : celui de la section 3 fera l'affaire. |
| Les images expirent | Les adresses renvoyées par l'API (`media_url`) cessent de fonctionner au bout de quelques jours. Il faut recopier les images chez soi à chaque rafraîchissement. |

### La marche à suivre, le jour venu

1. Basculer le compte en **compte professionnel** (Instagram → Paramètres →
   Type de compte). C'est réversible et cela ne change rien pour les abonnés.
2. Créer une application sur `developers.facebook.com`, produit
   *Instagram*, et obtenir un jeton longue durée.
3. Écrire une tâche planifiée quotidienne côté serveur qui appelle :

   ```
   GET https://graph.instagram.com/me/media
       ?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp
       &access_token=…
   ```

   télécharge chaque image, l'enregistre à côté des autres médias du site, puis
   écrit un `public/data/instagram.json` ne contenant que des **chemins
   locaux**.
4. Remplacer le corps de `getInstagramPosts()` par la lecture de ce fichier.
   **Aucun composant n'est à modifier** : ils ne connaissent que cette fonction.
5. Facultatif : le nombre d'abonnés se lit sur le même jeton
   (`GET https://graph.instagram.com/me?fields=followers_count`). La même tâche
   peut l'écrire dans le JSON et `SOCIAL.instagram.live` passe alors à `true`.

### La solution sans serveur, et pourquoi elle est écartée

Des widgets tiers (LightWidget, Behold, Elfsight, SnapWidget…) font tout cela à
notre place, sans ligne de code. Trois raisons de ne pas les retenir :

- ils sont **payants** au-delà d'un petit quota, et l'abonnement s'ajoute aux
  frais récurrents du client ;
- ils **ralentissent** la page : un script tiers, une iframe et des images
  servies depuis un autre domaine ;
- ils **déposent des traceurs**. Il faudrait les soumettre au bandeau de
  consentement, donc n'afficher la grille qu'après acceptation, et le site
  perdrait son absence totale de cookies tiers — un argument qui tient
  aujourd'hui, et qui est écrit noir sur blanc dans la politique de
  confidentialité.

---

## 7. Avant la mise en ligne, dans tous les cas

- [ ] Compléter les mentions légales (SIRET, TVA, hébergeur, carte
      professionnelle d'éducateur sportif, assurance RC pro) — voir
      `src/app/mentions-legales/page.tsx`.
- [ ] Faire relire les CGV par un professionnel du droit.
- [ ] Désigner un médiateur de la consommation et l'indiquer dans les CGV.
- [ ] Remplacer les témoignages de démonstration par de vrais avis (publier des
      avis inventés est une pratique commerciale trompeuse).
- [ ] Confirmer l'adresse, le téléphone et l'email réels (`src/lib/config.ts`).
- [ ] Remplacer les visuels provisoires — voir [`MEDIA.md`](./MEDIA.md).
- [ ] Vérifier le chemin de base (`NEXT_PUBLIC_BASE_PATH`) selon l'hébergement.
- [ ] Remplacer les publications Instagram de démonstration, ou vider
      `CURATED` dans `src/lib/instagram.ts` (voir la section 6).
- [ ] Relire le nombre d'abonnés affiché (`SOCIAL.instagram.followersLabel`).
