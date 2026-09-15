#!/usr/bin/env python3
"""
Génère les médias PROVISOIRES du site (vidéo de fond + visuels du local).

⚠️  Ces fichiers sont des placeholders : ils sont composés aux couleurs de la
charte BOUGE. en attendant les vraies prises de vue (local en travaux).
Voir docs/MEDIA.md pour la procédure de remplacement (dépôt du fichier au même
nom dans public/media/, aucune modification de code nécessaire).

    python3 tools/build-media.py
"""
import math
import subprocess
from pathlib import Path

import numpy as np
import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "media"
BRAND = ROOT / "public" / "brand"
OUT.mkdir(parents=True, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

# --- Palette officielle BOUGE. (cf. Brand Guidelines p.21) -------------------
ANTHRACITE = np.array([35, 35, 35], np.float32)
CREME = np.array([255, 251, 232], np.float32)
ORANGE = np.array([226, 97, 41], np.float32)
JADE = np.array([67, 150, 119], np.float32)
BROWN = np.array([89, 68, 58], np.float32)
SKY = np.array([105, 172, 222], np.float32)

FPS = 25
DURATION = 12  # secondes — boucle parfaite


def make_grain(h, w, tiles=8, seed=7):
    rng = np.random.default_rng(seed)
    return [rng.normal(0, 1, (h, w)).astype(np.float32) for _ in range(tiles)]


def render_frame(X, Y, phase, grain_tiles, frame_idx):
    """Fond animé abstrait : masses de couleur en mouvement + balayages de lumière."""
    h, w = X.shape
    img = np.repeat(ANTHRACITE[None, None, :], h, 0).repeat(w, 1).copy()

    # Masses de couleur organiques, chacune sur une orbite périodique
    # (multiples entiers de la phase => la boucle est parfaite).
    # Masses de couleur organiques, chacune sur une orbite périodique
    # (multiples entiers de la phase => la boucle est parfaite).
    # Les gains restent bas : le fond doit rester sombre pour que le logo crème
    # et le CTA gardent un contraste confortable par-dessus.
    blobs = [
        # couleur,  cx,   cy,   rx,   ry,   rayon, k, déphasage, gain
        (ORANGE, 0.20, 0.08, 0.10, 0.06, 0.20, 1, 0.0, 0.62),
        (ORANGE, 0.86, 0.46, 0.08, 0.07, 0.17, 2, 1.9, 0.42),
        (JADE,   0.72, 0.06, 0.11, 0.05, 0.17, 1, 2.4, 0.34),
        (SKY,    0.06, 0.44, 0.07, 0.07, 0.13, 2, 4.1, 0.24),
        (BROWN,  0.46, 0.34, 0.16, 0.05, 0.26, 1, 3.3, 0.34),
        (ORANGE, 0.52, 0.55, 0.13, 0.04, 0.11, 3, 0.7, 0.28),
    ]
    for color, cx0, cy0, rx, ry, rad, k, off, gain in blobs:
        cx = cx0 + rx * math.cos(k * phase + off)
        cy = cy0 + ry * math.sin(k * phase + off)
        # Respiration du rayon : donne un pouls, comme un rythme d'effort.
        r = rad * (1.0 + 0.10 * math.sin(2 * phase + off))
        d2 = (X - cx) ** 2 + (Y - cy) ** 2
        field = np.exp(-d2 / (2 * r * r), dtype=np.float32) * gain
        img += (color - ANTHRACITE)[None, None, :] * field[:, :, None]

    # Traînées de vitesse : bandes fines en diagonale qui balaient l'écran.
    ang = math.radians(-24)
    V = -X * math.sin(ang) + Y * math.cos(ang)
    for i, (width, gain, speed) in enumerate([(0.010, 0.13, 1), (0.005, 0.10, 2), (0.017, 0.07, 1)]):
        pos = ((V + 0.35 * i + phase / (2 * math.pi) * speed) % 0.42) - 0.21
        streak = np.exp(-(pos ** 2) / (2 * width * width), dtype=np.float32) * gain
        img += (CREME - ANTHRACITE)[None, None, :] * streak[:, :, None]

    # Vignettage marqué : réserve une zone calme au centre pour le logo et le CTA.
    cxv, cyv = 0.5, Y.max() / 2
    vign = 1.0 - 0.62 * np.clip(((X - cxv) ** 2 + (Y - cyv) ** 2) / 0.30, 0, 1)
    img *= vign[:, :, None]

    # Grain argentique léger : casse le banding des dégradés.
    img += grain_tiles[frame_idx % len(grain_tiles)][:, :, None] * 3.0

    return np.clip(img, 0, 255).astype(np.uint8)


def render_video(name, w, h, bitrate, crf):
    print(f"  · {name} ({w}×{h})…")
    xs = np.linspace(0, 1, w, dtype=np.float32)
    ys = np.linspace(0, h / w, h, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys)
    grain = make_grain(h, w)

    cmd = [
        FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
        "-an",                                   # pas de piste audio : lecture en autoplay muet
        "-c:v", "libx264", "-preset", "slow",
        "-crf", str(crf), "-maxrate", bitrate, "-bufsize", "4M",
        "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.0",
        "-movflags", "+faststart",               # démarre la lecture avant fin du téléchargement
        "-g", str(FPS * 2),
        str(OUT / name),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    total = FPS * DURATION
    first = None
    for i in range(total):
        phase = 2 * math.pi * i / total
        frame = render_frame(X, Y, phase, grain, i)
        if i == 0:
            first = frame.copy()
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    proc.wait()
    size = (OUT / name).stat().st_size
    print(f"    ✓ {size // 1024} Ko")
    return first


def build_poster(frame):
    """Image de repli : affichée avant le chargement de la vidéo, sur mobile en
    mode économie de données, et si l'utilisateur a réduit les animations."""
    im = Image.fromarray(frame)
    im.save(OUT / "hero-poster.webp", "WEBP", quality=82, method=6)
    print(f"    ✓ hero-poster.webp {(OUT / 'hero-poster.webp').stat().st_size // 1024} Ko")


# --------------------------------------------------------------------------
# Visuels provisoires du local : compositions graphiques aux couleurs de la
# charte (trame de demi-teintes reprise de la mascotte), à remplacer par les
# photos réelles une fois les travaux terminés.
# --------------------------------------------------------------------------
PLACEHOLDERS = [
    # nom de fichier,             teinte 1,  teinte 2,  filigrane
    ("studio-espace-coaching",    ORANGE,    BROWN,     "mascotte-lift-light.webp"),
    ("studio-boutique",           BROWN,     CREME,     "mascotte-walk-dark.webp"),
    ("studio-vestiaire",          JADE,      ANTHRACITE,"monogram-jade.webp"),
    ("studio-douches",            SKY,       BROWN,     "monogram-anthracite.webp"),
    ("studio-accueil",            CREME,     ORANGE,    "mascotte-walk-dark.webp"),
    ("studio-materiel",           BROWN,     ORANGE,    "mascotte-run-light.webp"),
    ("osteo-cabinet",             JADE,      BROWN,     "monogram-jade.webp"),
    ("osteo-salle-attente",       SKY,       ANTHRACITE,"monogram-anthracite.webp"),
    ("melvin-portrait",           ORANGE,    ANTHRACITE,"mascotte-walk-light.webp"),
    ("melvin-coaching",           JADE,      ANTHRACITE,"mascotte-run-light.webp"),
]


def halftone(w, h, spacing=9, radius=2.6, seed=3):
    """Trame de points façon illustration de la mascotte BOUGE."""
    layer = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(layer)
    rng = np.random.default_rng(seed)
    for gy in range(0, h + spacing, spacing):
        for gx in range(0, w + spacing, spacing):
            r = radius * (0.55 + 0.45 * rng.random())
            d.ellipse([gx - r, gy - r, gx + r, gy + r], fill=255)
    return layer


def build_placeholder(name, c1, c2, watermark, w=1600, h=1100):
    xs = np.linspace(0, 1, w, dtype=np.float32)
    ys = np.linspace(0, 1, h, dtype=np.float32)
    X, Y = np.meshgrid(xs, ys)

    # Dégradé diagonal entre les deux teintes, incurvé pour éviter l'effet « bannière ».
    t = np.clip(0.5 + 0.62 * (X - 0.5) + 0.42 * (Y - 0.5) + 0.12 * np.sin(X * 3.1 + Y * 2.2), 0, 1)
    base = c1[None, None, :] * (1 - t)[:, :, None] + c2[None, None, :] * t[:, :, None]

    # Halo lumineux hors-champ : donne de la profondeur, comme une source de lumière.
    d2 = (X - 0.78) ** 2 + (Y - 0.12) ** 2
    base += (CREME - base) * np.exp(-d2 / 0.09, dtype=np.float32)[:, :, None] * 0.28

    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))

    # Trame de demi-teintes, en très léger, cohérente avec l'illustration de marque.
    ht = halftone(w, h).filter(ImageFilter.GaussianBlur(0.4))
    tint = Image.new("RGB", (w, h), tuple(np.clip(c2 * 0.55, 0, 255).astype(int)))
    img = Image.composite(Image.blend(img, tint, 0.30), img, ht.point(lambda v: int(v * 0.22)))

    # Filigrane de marque
    wm_path = BRAND / watermark
    if wm_path.exists():
        wm = Image.open(wm_path).convert("RGBA")
        target = int(w * 0.42)
        wm.thumbnail((target, target), Image.LANCZOS)
        alpha = wm.split()[3].point(lambda v: int(v * 0.17))
        wm.putalpha(alpha)
        img = img.convert("RGBA")
        img.alpha_composite(wm, (int(w * 0.56), int(h - wm.height * 0.92)))
        img = img.convert("RGB")

    arr = np.asarray(img, np.float32)
    rng = np.random.default_rng(11)
    arr += rng.normal(0, 3.2, (h, w, 1))
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

    dest = OUT / f"{name}.webp"
    img.save(dest, "WEBP", quality=84, method=6)
    print(f"    ✓ {dest.name:28s} {dest.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Génère les médias provisoires du site.")
    parser.add_argument(
        "--video",
        action="store_true",
        help="régénère aussi la vidéo de fond abstraite (refusé si une vraie vidéo est déjà en place)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="écrase la vidéo existante — à n'utiliser qu'en connaissance de cause",
    )
    args = parser.parse_args()

    # ⚠️ GARDE-FOU : le studio a déposé sa vraie vidéo dans public/media/hero.mp4.
    # Sans ce contrôle, relancer ce script par réflexe l'écraserait par la vidéo
    # abstraite de démonstration, sans prévenir.
    if args.video:
        existing = OUT / "hero.mp4"
        if existing.exists() and not args.force:
            print(
                f"REFUS : {existing} existe déjà.\n"
                "        S'il s'agit de la vraie vidéo du studio, ne la régénérez pas.\n"
                "        Pour passer outre volontairement : --video --force"
            )
        else:
            print("Vidéo de fond (provisoire) :")
            first = render_video("hero.mp4", 1920, 1080, "1400k", 28)
            render_video("hero-mobile.mp4", 720, 1280, "700k", 30)
            build_poster(first)

    print("Visuels provisoires du local :")
    for name, c1, c2, wm in PLACEHOLDERS:
        build_placeholder(name, c1, c2, wm)
    print("Terminé.")
