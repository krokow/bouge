# Remplacer les médias provisoires

La **vidéo de fond est celle du studio** : elle a été déposée par le client, puis
réencodée et déclinée en version allégée pour les téléphones (voir plus bas).

Le local étant en travaux, **les visuels du studio, eux, restent provisoires**.
Ils ont été composés aux couleurs de la charte BOUGE. pour que la démonstration
soit présentable, mais ils n'ont pas vocation à rester.

> ⚠️ `tools/build-media.py` **ne régénère plus la vidéo par défaut** : il refuse
> d'écraser un `hero.mp4` existant. Sans ce garde-fou, relancer le script par
> réflexe remplacerait la vraie vidéo par l'ancienne animation abstraite.

Tout se remplace **en déposant un fichier au même nom** dans `public/media/`.
Aucune ligne de code à modifier, aucun déploiement particulier : le prochain
build prend les nouveaux fichiers.

---

## Vidéo de fond de la page d'accueil

| Fichier | Format attendu | Poids conseillé | Rôle |
|---|---|---|---|
| `public/media/hero.mp4` | MP4 H.264, 1920×1080, muet | < 3 Mo | Ordinateurs, tablettes, téléphones en paysage |
| `public/media/hero-mobile.mp4` | MP4 H.264, 540×720 (portrait 3:4, centre de l'image), muet | < 1,5 Mo | Téléphones tenus en portrait (≤ 700 px de large) |
| `public/media/hero-poster.webp` | WebP, 1920×1080 | < 150 Ko | Image affichée avant le démarrage de la vidéo, et si la lecture automatique est refusée |

Version en ligne (novembre 2026) : vidéo du studio livrée par le client
(`video_client.mov`, 1920×1080, 14,4 s, 360 images, montage de plans courts).

**La boucle démarre au plan des gainages en groupe (image 87, 3,48 s) et non au
début du fichier** : le premier plan de la vidéo montre l'affiche « Bouge. »,
que le logo du site recouvrait dès l'arrivée sur la page (deux logos
superposés). Rien n'est coupé : les 87 premières images sont replacées à la
fin. Les deux raccords tombent sur des coupes du montage, la boucle reste donc
sans saut. L'affiche est cette même image 87 : le fondu de l'affiche vers la
vidéo est invisible.

### Ce que doit contenir la vidéo

Une boucle courte (8 à 15 secondes), **sans coupe brutale entre la fin et le
début** — elle tourne en continu. Le logo se superpose au centre : il faut donc
que le centre de l'image reste relativement calme et pas trop clair. Les plans
serrés (mains sur une barre, foulée, respiration, eau) fonctionnent mieux qu'un
plan large du studio, qui sera de toute façon plus lisible en photo.

### Recette d'encodage

À partir d'un rush `source.mov`, avec [ffmpeg](https://ffmpeg.org) :

```bash
# Point de départ de la boucle (numéro d'image, à choisir sur une coupe)
START=87
ROT="[0:v]trim=start_frame=$START,setpts=PTS-STARTPTS[a];[0:v]trim=end_frame=$START,setpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=1[r]"

# Version paysage (1920×1080, ~2,9 Mo pour 14 s)
ffmpeg -i source.mov -an -filter_complex "$ROT;[r]scale=1920:1080:flags=lanczos[o]" -map "[o]" \
  -c:v libx264 -preset slow -crf 27 -maxrate 2200k -bufsize 4400k \
  -profile:v high -level 4.0 -pix_fmt yuv420p -movflags +faststart -tag:v avc1 \
  public/media/hero.mp4

# Version téléphone : recadrage portrait 3:4 au centre, à partir de la source
# 1080p (c'est la zone qu'un écran vertical affiche de toute façon)
ffmpeg -i source.mov -an -filter_complex "$ROT;[r]crop=810:1080,scale=540:720:flags=lanczos[o]" -map "[o]" \
  -c:v libx264 -preset slow -crf 27 -maxrate 1100k -bufsize 2200k \
  -profile:v high -level 3.1 -pix_fmt yuv420p -movflags +faststart -tag:v avc1 \
  public/media/hero-mobile.mp4

# Affiche : la première image de la boucle
ffmpeg -i source.mov -vf "select=eq(n\,$START)" -frames:v 1 -c:v libwebp -quality 78 \
  public/media/hero-poster.webp
```

La source (22 Mo) ne fait pas partie du site publié : seuls les trois fichiers
encodés le sont. Elle reste récupérable dans l'historique git (commit « Add
files via upload », novembre 2026).

`-an` retire la piste audio : elle est inutile (la lecture est muette, condition
imposée par les navigateurs pour l'autoplay) et alourdit le fichier.
`-movflags +faststart` permet à la lecture de commencer avant la fin du
téléchargement.

> La vidéo est chargée **dans tous les cas**, sans condition : c'est une demande
> explicite du studio. L'affiche ne sert plus que de repli quand le navigateur
> refuse la lecture automatique (économiseur de batterie iOS, réglage
> utilisateur) ou si le fichier ne charge pas.

---

## Visuels du studio

Tous au format **WebP ou JPG**, cadrage **paysage 3:2 environ**, largeur
**1600 px**, poids **< 250 Ko**.

| Fichier | Ce qu'il doit montrer | Où il apparaît |
|---|---|---|
| `studio-espace-coaching.webp` | La grande pièce d'entraînement | Accueil, page Le studio |
| `studio-vestiaire.webp` | Le vestiaire, les casiers | Accueil, page Le studio |
| `studio-douches.webp` | Les douches | Accueil, page Le studio |
| `studio-accueil.webp` | L'entrée, la salle d'attente | Page Le studio, page Contact |
| `studio-boutique.webp` | Le comptoir : boissons et articles en vente | Accueil, page Le studio |
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
