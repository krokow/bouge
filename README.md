# BOUGE. — site du studio

Site vitrine et système de réservation en ligne du studio de coaching sportif
**BOUGE.** à Courbevoie.

> **Démonstration.** Cette version est destinée à être présentée au client avant
> la migration vers l'hébergement définitif. Elle fonctionne entièrement dans le
> navigateur : les comptes, réservations et paiements sont **simulés**, aucune
> donnée ne quitte le poste du visiteur et aucun paiement n'est encaissé.
> Voir [`docs/MIGRATION.md`](docs/MIGRATION.md) pour le passage en production.

---

## Démarrer

```bash
npm install
npm run dev          # http://localhost:3000
```

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Export statique dans `out/` |
| `npm run typecheck` | Vérification TypeScript |
| `npm run assets` | Régénère `public/brand/` et `public/fonts/` depuis la charte |
| `npm run media` | Régénère les visuels provisoires du local (ne touche jamais à la vidéo) |

Vérifications visuelles et fonctionnelles (le site doit être construit avant) :

```bash
node tools/check-pages.mjs        # 12 pages × 5 largeurs : débordements, erreurs JS
node tools/test-booking.mjs 1440  # tunnel de réservation de bout en bout
node tools/test-admin.mjs 390     # espace gérant, toutes les sections
node tools/test-hero-video.mjs    # source, lecture automatique et fondu du hero
node tools/test-reduced-motion.mjs # le site est identique avec « animations réduites »
node tools/test-map.mjs           # carte : chargement, marqueur, déplacement, zoom, repli
```

Les deux dernières commandes nécessitent Python 3 (`pip install pillow fonttools brotli numpy imageio-ffmpeg`). Elles ne sont à relancer que si la charte graphique évolue.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|---|---|---|
| Gérant | `melvin@bouge-studio.fr` | `bouge2026` |
| Cliente | `camille.ferrand@example.com` | `demo1234` |

Tous les comptes clients de démonstration utilisent `demo1234`. Le bouton
« Réinitialiser la démo » de l'espace gérant remet le jeu de données à zéro.

---

## Ce que contient le site

**Pages publiques** — accueil (fond vidéo, animations au défilement), nos
offres (section épinglée : le défilement fait traverser les quatre formules
l'une après l'autre), le studio (espaces, comptoir boissons et boutique,
règles du lieu), ostéopathie (« bientôt disponible »), à propos, contact,
mentions légales, CGV, politique de confidentialité, page 404. Bandeau
cookies conforme RGPD sur l'ensemble du site.

**Tunnel de réservation** (`/reserver/`) — six étapes : participants (1 à 3),
formule, date et créneau sur un même écran (cliquer un jour affiche aussitôt
ses horaires), création de compte ou connexion, paiement (sur place ou carte
bancaire simulée), confirmation avec export `.ics`. Emails de confirmation et
de rappel simulés.

**Espace client** (`/compte/`) — séances à venir, report et annulation en
autonomie jusqu'à 24 h avant, historique, profil, export des données et
suppression du compte (RGPD).

**Espace gérant** (`/admin/`) — tableau de bord du jour et de la semaine, vue
calendrier hebdomadaire, liste filtrable des réservations, gestion des
indisponibilités (journée, semaine, période, créneau), statistiques avec
graphiques, boîte d'envoi des emails, export `.ics` de l'agenda.

---

## Charte graphique

Le dossier `BOUGE-charte graphique/` contient la charte fournie par le studio de
design **Call me Claro**. Elle est la source de tout ce qui est visible :

- **Couleurs** (Brand Guidelines p. 21) — noir anthracite `#232323`, crème
  `#fffbe8`, orange vif `#e26129`, vert jade `#439677`, brun café `#59443a`,
  bleu ciel `#69acde`, blanc `#ffffff` ;
- **Typographies** (p. 24) — **Sun Motter** pour les titres, **Manrope** pour le
  texte courant, **Reenie Beanie** pour les annotations manuscrites. Les trois
  sont auto-hébergées en WOFF2, sans aucun appel à un CDN externe ;
- **Logo, monogramme, tampon, mascotte, stickers** — repris des fichiers
  fournis, simplement détourés et convertis en WebP.

### Une particularité de Sun Motter à connaître

Sun Motter est une police **capitale**. Ses minuscules accentuées (`à`, `é`,
`ç`…) sont dessinées **sans accent**, alors que ses capitales accentuées (`À`,
`É`, `Ç`) existent bien. Le design system applique donc `text-transform:
uppercase` à tous les titres : le navigateur convertit `à` en `À` et les accents
sont correctement rendus.

Cinq caractères sont absents de la police : `?`, `—`, `…`, `€` et `Œ`. La pile
de polices bascule alors automatiquement sur **Manrope** plutôt que sur une
police système, pour rester dans l'univers de la marque. Les prix sont composés
par le composant `<Price>`, qui place le montant en Sun Motter et le `€` en
Manrope.

---

## Organisation du code

```
src/
├── app/                    Pages (App Router, export statique)
├── components/
│   ├── layout/             Navbar, pied de page, bandeau cookies
│   ├── home/               Sections de la page d'accueil
│   ├── booking/            Tunnel de réservation (étapes, calendrier)
│   ├── account/            Espace client
│   ├── admin/              Espace gérant (tableau de bord, graphiques SVG)
│   └── ui/                 Composants transverses (boutons, champs, révélations)
├── data/offers.ts          Catalogue des formules
└── lib/
    ├── types.ts            Modèle de données (= schéma de base future)
    ├── config.ts           Coordonnées, horaires, règles de réservation
    ├── availability.ts     Calcul des créneaux (fonctions pures)
    ├── stats.ts            Indicateurs du tableau de bord (fonctions pures)
    ├── ics.ts              Export iCalendar (RFC 5545)
    └── store/              Couche d'accès aux données — le seul fichier à
                            remplacer lors du passage à un vrai back-end
tools/                      Scripts de génération d'assets et de tests visuels
docs/                       Migration, médias, contenu à confirmer
```

L'ensemble des règles métier (disponibilités, statistiques, iCalendar) est
écrit en **fonctions pures sans accès au stockage** : elles seront réutilisées
telles quelles côté serveur, ce qui garantit que le client et le back-end
appliqueront exactement les mêmes règles.

---

## Adaptation aux écrans

Le site est fluide, sans paliers brusques :

- **typographie et espacements en `clamp()`** — interpolation continue entre
  375 px et 1920 px ;
- **grilles en `auto-fill`** — le nombre de colonnes suit la place disponible ;
- **section épinglée des offres** — active à partir de 1024×760 px ; en dessous,
  les quatre formules sont simplement empilées. Le défilement natif n'est jamais
  intercepté : inertie, clavier, barre de défilement et retour arrière
  fonctionnent normalement ;
- **fond vidéo** — version allégée sur téléphone (1,7 Mo contre 5,9),
  `object-fit: cover` pour ne jamais déformer, voile de lisibilité garantissant
  le contraste du logo et du bouton d'appel à l'action ;
- **navigation** — panneau latéral sous 1024 px, avec « Prendre rendez-vous »
  toujours visible dans la barre ;
- **tunnel de réservation** — cibles tactiles d'au moins 44 px, récapitulatif
  repliable en bas d'écran, aucun défilement horizontal ;
- **espace gérant** — tableaux transformés en cartes, calendrier hebdomadaire
  transformé en liste journalière : le gérant peut bloquer un créneau depuis son
  téléphone ;
Le site se comporte **strictement de la même façon pour tous les visiteurs** :
la préférence système « animations réduites » ne modifie ni la mise en page, ni
les animations, ni le fonctionnement du défilement. C'est un choix explicite du
studio, vérifié par `tools/test-reduced-motion.mjs`. La marche à suivre pour
revenir dessus est notée en fin de `src/app/globals.css`.

Testé à 375, 390, 430, 768, 1024, 1280, 1440 et 1920 px.

---

## Déploiement

### GitLab Pages

`.gitlab-ci.yml` est prêt à l'emploi. **Vérifier le chemin de base** avant le
premier déploiement : si le projet utilise un domaine unique
(`https://<projet>-xxxx.gitlab.io/`), définir la variable CI/CD
`PAGES_BASE_PATH` à une chaîne vide. Les explications figurent en tête du
fichier.

### GitHub Pages

`.github/workflows/deploy-pages.yml` est prêt. Activer une fois :
**Settings ▸ Pages ▸ Source = GitHub Actions**.

### Hébergement OVH

```bash
NEXT_PUBLIC_BASE_PATH="" npm run build
# déposer le contenu de out/ dans www/
```

Détails et fichier `.htaccess` dans [`docs/MIGRATION.md`](docs/MIGRATION.md).

---

## Limites assumées de cette démonstration

- **Visuels du local provisoires** — le local est en travaux. Ils sont composés
  aux couleurs de la charte et se remplacent en déposant un fichier, sans
  toucher au code. La vidéo de fond, elle, est la vraie vidéo du studio.
  Voir [`docs/MEDIA.md`](docs/MEDIA.md).
- **Aucun paiement réel** — l'écran de carte bancaire est une maquette, à
  remplacer par Stripe.
- **Aucune donnée envoyée** — tout vit dans le navigateur.
- **Sécurité non implémentée** — le contrôle d'accès à l'espace gérant est
  visuel. Il devra être fait côté serveur. Voir la section 4 de
  [`docs/MIGRATION.md`](docs/MIGRATION.md).
- **Contenu à valider** — tarifs, témoignages, temps de trajet. Voir
  [`docs/CONTENU.md`](docs/CONTENU.md).

---

Identité visuelle : **Call me Claro**.
