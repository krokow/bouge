# Contenu à confirmer par le studio

Tous les textes du site ont été **rédigés pour la démonstration**, à partir du
positionnement décrit dans les *Brand Guidelines* (ton chaleureux et motivant,
public intergénérationnel, coaching en petit comité). Ils sont crédibles et
cohérents, mais ils n'ont pas été validés par le studio.

Voici ce qui doit être relu ou corrigé, par ordre d'importance.

## 1. Inventé, à remplacer par du réel

| Information | Valeur actuelle | Où |
|---|---|---|
| Adresse | 18 rue de l'Industrie, 92400 Courbevoie | `src/lib/config.ts` |
| Téléphone | 01 99 00 14 25 — numéro de la plage réservée à la fiction par l'ARCEP, il ne sonne chez personne | `src/lib/config.ts` |
| Email | bonjour@bouge-studio.fr | `src/lib/config.ts` |
| Instagram | instagram.com/bouge.studio | `src/lib/config.ts` |
| Accès (métro, bus) | Lignes plausibles pour Courbevoie | `src/lib/config.ts` |
| Nom de famille du coach | « Melvin Cordier » | `src/lib/store/seed.ts` |
| Témoignages clients | Trois avis inventés | `src/components/home/Testimonials.tsx` |

> ⚠️ Les **témoignages** doivent impérativement être remplacés par de vrais avis
> avant la mise en ligne. Publier des avis fictifs présentés comme réels est une
> pratique commerciale trompeuse (art. L121-2 du code de la consommation).

## 2. Tarifs et formules — à valider

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

## 3. Horaires et règles de réservation

Dans `src/lib/config.ts` (`SCHEDULE`) :

- ouverture lundi-vendredi 7h-21h, samedi 9h-14h, fermé le dimanche ;
- créneaux d'une heure ;
- réservation possible jusqu'à 60 jours à l'avance ;
- délai minimum de 2 h avant une séance ;
- annulation et report libres jusqu'à 24 h avant ;
- rappel automatique 24 h avant.

Ces valeurs alimentent à la fois le tunnel de réservation, l'espace gérant et
les CGV : il n'y a qu'un seul endroit à modifier.

## 4. Histoire du fondateur

La page *À propos* reprend le récit des *Brand Guidelines* (natation, perte de
sa mère à 18 ans, dix ans d'enseignement sans vitrine, diplôme STAPS à 30 ans).
C'est un récit personnel : **à faire valider mot à mot par Melvin**, notamment
le passage sur sa mère, qu'il peut légitimement vouloir retirer d'un site
public.

## 5. Ostéopathie

La page annonce une ouverture « l'an prochain » et décrit un cabinet dédié avec
salle d'attente. À ajuster dès que la date et le praticien sont connus. Le
formulaire « être prévenu » n'envoie rien pour l'instant.

## 6. Écart avec les Brand Guidelines

Les *Brand Guidelines* décrivent BOUGE. comme un **concept store** : espace de
coaching **+ coffee shop + boutique de vêtements et d'accessoires**.

Le brief de ce site décrit un **studio sport premium** avec douche et vestiaire,
et un **cabinet d'ostéopathie** à venir — sans coffee shop ni boutique.

Le site a été construit sur le brief (studio + ostéopathie), en gardant le ton,
les valeurs et l'univers de la charte. **Si le coffee shop et la boutique font
toujours partie du projet, il manque deux pages** et une place dans la
navigation. C'est un point à trancher avec le studio.
