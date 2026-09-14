# Remplacer les médias provisoires

Le local étant en travaux, **la vidéo de fond et tous les visuels du studio sont
provisoires**. Ils ont été composés aux couleurs de la charte BOUGE. pour que la
démonstration soit présentable, mais ils n'ont évidemment pas vocation à rester.

Tout se remplace **en déposant un fichier au même nom** dans `public/media/`.
Aucune ligne de code à modifier, aucun déploiement particulier : le prochain
build prend les nouveaux fichiers.

---

## Vidéo de fond de la page d'accueil

| Fichier | Format attendu | Poids conseillé | Rôle |
|---|---|---|---|
| `public/media/hero.mp4` | MP4 H.264, 1920×1080, muet | < 3 Mo | Écrans larges et tablettes |
| `public/media/hero-mobile.mp4` | MP4 H.264, 720×1280 (portrait), muet | < 1,5 Mo | Téléphones (format vertical) |
| `public/media/hero-poster.webp` | WebP ou JPG, 1920×1080 | < 150 Ko | Image affichée avant la vidéo, et en mode économie de données |

### Ce que doit contenir la vidéo

Une boucle courte (8 à 15 secondes), **sans coupe brutale entre la fin et le
début** — elle tourne en continu. Le logo se superpose au centre : il faut donc
que le centre de l'image reste relativement calme et pas trop clair. Les plans
serrés (mains sur une barre, foulée, respiration, eau) fonctionnent mieux qu'un
plan large du studio, qui sera de toute façon plus lisible en photo.

### Recette d'encodage

À partir d'un rush `source.mov`, avec [ffmpeg](https://ffmpeg.org) :

```bash
# Version paysage
ffmpeg -i source.mov -t 12 -an \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" \
  -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart \
  public/media/hero.mp4

# Version portrait, pour les téléphones
ffmpeg -i source.mov -t 12 -an \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" \
  -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart \
  public/media/hero-mobile.mp4

# Affiche (première image)
ffmpeg -i public/media/hero.mp4 -frames:v 1 -q:v 3 public/media/hero-poster.webp
```

`-an` retire la piste audio : elle est inutile (la lecture est muette, condition
imposée par les navigateurs pour l'autoplay) et alourdit le fichier.
`-movflags +faststart` permet à la lecture de commencer avant la fin du
téléchargement.

> Le composant `src/components/home/HeroVideo.tsx` ne charge la vidéo que si le
> visiteur n'a ni activé le mode économie de données, ni demandé la réduction
> des animations, ni une connexion 2G. Dans ces cas, l'affiche seule est
> montrée. Il est donc important qu'elle soit belle.

---

## Visuels du studio

Tous au format **WebP ou JPG**, cadrage **paysage 3:2 environ**, largeur
**1600 px**, poids **< 250 Ko**.

| Fichier | Ce qu'il doit montrer | Où il apparaît |
|---|---|---|
| `studio-espace-coaching.webp` | La grande pièce d'entraînement | Accueil, page Le studio |
| `studio-vestiaire.webp` | Le vestiaire, les casiers | Accueil, page Le studio |
| `studio-douches.webp` | Les douches | Accueil, page Le studio |
| `studio-accueil.webp` | L'entrée, le sas d'accueil | Page Le studio, page Contact |
| `studio-materiel.webp` | Le matériel (charges, kettlebells, rameur) | Réserve |
| `osteo-cabinet.webp` | Le futur cabinet d'ostéopathie | Accueil, page Ostéopathie |
| `osteo-salle-attente.webp` | La future salle d'attente | Page Ostéopathie |
| `melvin-portrait.webp` | Portrait de Melvin (cadrage **portrait 4:5**) | Page À propos |
| `melvin-coaching.webp` | Melvin en séance | Réserve |

### Conversion en WebP

```bash
# Un fichier
cwebp -q 82 -resize 1600 0 photo.jpg -o public/media/studio-espace-coaching.webp

# Tout un dossier de photos déjà nommées correctement
for f in photos/*.jpg; do
  cwebp -q 82 -resize 1600 0 "$f" -o "public/media/$(basename "${f%.jpg}").webp"
done
```

---

## Et les logos, la mascotte, les polices ?

Ils sont **définitifs** et proviennent directement de la charte fournie
(`BOUGE-charte graphique/`). Ils ne sont pas à remplacer.

Si le studio de design livre une nouvelle version de la charte, il suffit de
remplacer le dossier `BOUGE-charte graphique/` puis de relancer :

```bash
npm run assets   # régénère public/brand/ et public/fonts/ depuis la charte
```

---

## Textes des pages

Les textes ont été rédigés pour la démonstration. Les points à confirmer par le
studio avant mise en ligne sont regroupés dans [`CONTENU.md`](./CONTENU.md).
