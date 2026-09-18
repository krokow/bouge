# Contenu à confirmer par le studio

Tous les textes du site ont été **rédigés pour la démonstration**, à partir du
positionnement décrit dans les *Brand Guidelines* (ton chaleureux et motivant,
public intergénérationnel, coaching en petit comité). Ils sont crédibles et
cohérents, mais ils n'ont pas été validés par le studio.

Voici ce qui doit être relu ou corrigé, par ordre d'importance.

## 1. Confirmé par le studio — à jour dans le site

| Information | Valeur |
|---|---|
| Coach | Melvin Maillot |
| Adresse | 8 rue Albert Simonin, 92400 Courbevoie |
| Téléphone | 06 74 90 08 02 |
| Salle d'attente | Articles à vendre + boissons chaudes et froides |
| Instagram | [@melvinmaillot](https://www.instagram.com/melvinmaillot/) — compte personnel de Melvin, pas du studio |

## 2. Encore inventé, à remplacer par du réel

| Information | Valeur actuelle | Où |
|---|---|---|
| Email | bonjour@bouge-studio.fr | `src/lib/config.ts` |
| Accès et temps de trajet | Formulations volontairement prudentes, non vérifiées sur place | `src/lib/config.ts` |
| **Coordonnées du marqueur sur la carte** | **Pointent sur le quartier, pas sur le numéro** | `src/lib/config.ts` → `STUDIO.coordinates` |
| Témoignages clients | Trois avis inventés | `src/components/home/Testimonials.tsx` |
| Nombre d'abonnés Instagram | `60 K`, saisi à la main et affiché avec un « + » | `src/lib/config.ts` → `SOCIAL.instagram` |
| Les deux autres coachs | Sarah Lemoine et Karim Benali, entièrement inventés | `src/lib/config.ts` → `TEAM_SEED` |
| Portraits des coachs | Aplats de marque avec initiales, générés par `tools/build-media.py` | `public/media/coach-*.webp` |
| Publications Instagram affichées | Quatre visuels du studio et des légendes écrites pour la maquette | `src/lib/instagram.ts` |
| Sorties collectives de démonstration | Trois runs inventés, dont un passé et un presque complet | `src/lib/store/seed.ts` |
| Ouverture du cabinet d'ostéopathie | « l'an prochain » | `src/components/home/OsteoTeaser.tsx` |

> ⚠️ Les **témoignages** doivent impérativement être remplacés par de vrais avis
> avant la mise en ligne. Publier des avis fictifs présentés comme réels est une
> pratique commerciale trompeuse (art. L121-2 du code de la consommation).

> ⚠️ Les quatre **publications Instagram** de la page À propos ne reprennent
> aucune publication réelle&nbsp;: ce sont des visuels du studio accompagnés de
> légendes écrites pour la maquette. Les remplacer par de vraies publications,
> ou vider le tableau `CURATED` de `src/lib/instagram.ts` — la section se
> réaffiche alors sans la grille, sans rien casser.
>
> ⚠️ **Sarah Lemoine** et **Karim Benali** sont des personnes inventées, au
> même titre que les témoignages. Avant la mise en ligne, deux possibilités :
> les remplacer par de vrais coachs depuis l'espace gérant (section
> « L'équipe »), ou les retirer — si Melvin reste seul, la section « L'équipe »
> de la page À propos disparaît d'elle-même et l'étape « Votre coach » du
> tunnel n'affiche plus que lui.
>
> Les **sorties collectives** du jeu de démonstration (« Run du samedi »,
> « Run de la Défense ») sont inventées, ainsi que leurs inscrits. Elles se
> calent automatiquement sur les prochains samedis pour que la démonstration
> reste crédible quelle que soit la date. Melvin programmera les vraies depuis
> son espace, section « Les runs » — et s'il n'en programme aucune, le site
> affiche « les prochaines dates arrivent bientôt » au lieu de faire
> disparaître la rubrique.
>
> Le **nombre d'abonnés** est écrit en dur. Il est affiché arrondi et précédé
> d'un « + » pour rester vrai tant que le compte grossit, mais il mérite d'être
> relu de temps en temps.

## 3. Tarifs et formules — à valider

Définis dans `src/data/offers.ts` :

| Formule | Durée | Participants | Prix |
|---|---|---|---|
| Séance découverte | 60 min | 1 à 2 | 35 € |
| Coaching individuel | 60 min | 1 | 75 € |
| Petit comité | 60 min | 2 à 3 | 45 € / personne |
| Formule mensuelle | 4 séances | 1 | 260 € / mois |

Les descriptions, les arguments et le public visé de chaque formule sont
également à relire. Modifier `src/data/offers.ts` suffit : le site entier
(page d'accueil, page Offres, tableau comparatif, tunnel de réservation, CGV)
se met à jour automatiquement.

## 4. Horaires et règles de réservation

Dans `src/lib/config.ts` (`SCHEDULE`) :

- ouverture lundi-vendredi 7h-21h, samedi 9h-14h, fermé le dimanche ;
- créneaux d'une heure ;
- réservation possible jusqu'à 60 jours à l'avance ;
- délai minimum de 2 h avant une séance ;
- annulation et report libres jusqu'à 24 h avant ;
- rappel automatique 24 h avant.

Ces valeurs alimentent à la fois le tunnel de réservation, l'espace gérant et
les CGV : il n'y a qu'un seul endroit à modifier.

## 5. Histoire du fondateur

La page *À propos* reprend le récit des *Brand Guidelines* (natation, perte de
sa mère à 18 ans, dix ans d'enseignement sans vitrine, diplôme STAPS à 30 ans).
C'est un récit personnel : **à faire valider mot à mot par Melvin**, notamment
le passage sur sa mère, qu'il peut légitimement vouloir retirer d'un site
public.

## 6. Ostéopathie

La page annonce une ouverture « l'an prochain » et décrit un cabinet dédié avec
salle d'attente. À ajuster dès que la date et le praticien sont connus. Le
formulaire « être prévenu » n'envoie rien pour l'instant.

## 7. La carte de la page Contact

La carte est fonctionnelle (déplacement, zoom, itinéraire), mais **le marqueur
n'est pas encore exactement sur la porte du studio** : l'adresse n'a pas pu être
géocodée automatiquement, et inventer des coordinnées aurait planté le repère à
côté.

Pour le placer précisément, en dix secondes :

1. ouvrir [Google Maps](https://www.google.com/maps) et chercher l'adresse ;
2. clic droit sur la porte du studio ;
3. cliquer sur les chiffres affichés en haut du menu — ils sont copiés
   (par exemple `48,8975, 2,2555`) ;
4. les reporter dans `src/lib/config.ts`, dans `STUDIO.coordinates`, en
   remplaçant les virgules décimales par des points, et passer `verified` à
   `true`.

## 8. Le comptoir : boutique et boissons

Point tranché avec le studio : *« dans la salle d'attente il y aura des articles
à vendre et la possibilité de consommer boissons froides ou chaudes »*.

C'est intégré comme un **comptoir dans la salle d'attente**, et non comme une
boutique en ligne : le site ne vend rien, il annonce ce qu'on trouve sur place.
Concrètement :

- une section **« Le comptoir »** sur la page *Le studio*, avec les quatre
  catégories (boissons chaudes, boissons fraîches, vestiaire BOUGE., produits
  de natation) ;
- la salle d'attente présentée comme un espace commun au coaching et au futur
  cabinet d'ostéopathie, sur les deux pages concernées ;
- deux atouts supplémentaires sur la page d'accueil.

Reste à préciser par le studio :

- la **liste et les prix** des articles réellement proposés ;
- si les boissons sont **payantes ou offertes** aux clients d'une séance ;
- si le comptoir doit un jour devenir une **vraie boutique en ligne** — ce qui
  serait un chantier distinct (catalogue, stocks, paiement, livraison).
