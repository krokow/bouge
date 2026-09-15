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

## 2. Encore inventé, à remplacer par du réel

| Information | Valeur actuelle | Où |
|---|---|---|
| Email | bonjour@bouge-studio.fr | `src/lib/config.ts` |
| Instagram | instagram.com/bouge.studio | `src/lib/config.ts` |
| Accès et temps de trajet | Formulations volontairement prudentes, non vérifiées sur place | `src/lib/config.ts` |
| Témoignages clients | Trois avis inventés | `src/components/home/Testimonials.tsx` |
| Ouverture du cabinet d'ostéopathie | « l'an prochain » | `src/components/home/OsteoTeaser.tsx` |

> ⚠️ Les **témoignages** doivent impérativement être remplacés par de vrais avis
> avant la mise en ligne. Publier des avis fictifs présentés comme réels est une
> pratique commerciale trompeuse (art. L121-2 du code de la consommation).

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

## 7. Le comptoir : boutique et boissons

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
