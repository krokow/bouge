#!/usr/bin/env python3
"""
Génère les assets web optimisés à partir de la charte graphique BOUGE.

Source  : "BOUGE-charte graphique/"  (fichiers HD fournis par le studio de design)
Sortie  : "public/brand/"            (PNG optimisés, détourés, prêts pour le web)

Relancer après toute mise à jour de la charte :
    python3 tools/build-brand-assets.py
"""
from pathlib import Path
from PIL import Image

Image.MAX_IMAGE_PIXELS = None  # les fichiers de la charte sont en très haute définition

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "BOUGE-charte graphique"
OUT = ROOT / "public" / "brand"
OUT.mkdir(parents=True, exist_ok=True)

# (fichier source, nom de sortie, largeur max)
ASSETS = [
    # --- Logo complet : wordmark + mascotte + baseline ---
    ("LOGO/PNG/LOGO + MASCOTTE + BASELINE/LOGOBOUGE.creme.png",        "logo-stack-creme.png",        1000),
    ("LOGO/PNG/LOGO + MASCOTTE + BASELINE/LOGOBOUGE.noiranthracite.png","logo-stack-anthracite.png",   1000),
    # --- Logo + baseline (sans mascotte) ---
    ("LOGO/PNG/LOGO +  BASELINE/LOGOBOUGE+baseline_creme.png",          "logo-baseline-creme.png",      900),
    ("LOGO/PNG/LOGO +  BASELINE/LOGOBOUGE+baseline_noiranthracite.png", "logo-baseline-anthracite.png", 900),
    # --- Wordmark seul (navbar) ---
    ("LOGO/PNG/LOGO SEUL/LOGOSEULBOUGE_creme.png",           "wordmark-creme.png",      720),
    ("LOGO/PNG/LOGO SEUL/LOGOSEULBOUGE_noiranthracite.png",  "wordmark-anthracite.png", 720),
    ("LOGO/PNG/LOGO SEUL/LOGOSEULBOUGE_blanc.png",           "wordmark-blanc.png",      720),
    # --- Monogramme « B » (favicon, avatars, puces) ---
    ("ASSETS/STICKERS/MONOGRAMME/MONOGRAMME_orange_creme.png",        "monogram-orange.png",     512),
    ("ASSETS/STICKERS/MONOGRAMME/MONOGRAMME_vertjade_creme.png",      "monogram-jade.png",       512),
    ("ASSETS/STICKERS/MONOGRAMME/MONOGRAMME_noiranthracite_creme.png","monogram-anthracite.png", 512),
    # --- Tampon / badge circulaire « DEPUIS 2026 » ---
    ("LOGO/PNG/TAMPON MONOGRAMME/TAMPONMONOGRAMME_orange_creme.png",       "badge-orange.png", 640),
    ("LOGO/PNG/TAMPON MONOGRAMME/TAMPONMONOGRAMME_creme_noiranthracite.png","badge-creme.png",  640),
    # --- Mascotte (version anthracite, pour fonds clairs) ---
    ("ASSETS/MASCOTTE/PNG/MASCOTTE_BOUGE.-NOIR01.png", "mascotte-walk-dark.png", 760),
    ("ASSETS/MASCOTTE/PNG/MASCOTTE_BOUGE.-NOIR02.png", "mascotte-lift-dark.png", 760),
    ("ASSETS/MASCOTTE/PNG/MASCOTTE_BOUGE.-NOIR03.png", "mascotte-run-dark.png",  760),
    ("ASSETS/MASCOTTE/PNG/MASCOTTE_BOUGE.--46.png",    "mascotte-face-dark.png", 512),
    # --- Mascotte (version crème, pour fonds sombres) ---
    ("ASSETS/MASCOTTE/PNG/MASCOTTE_BOUGE.-CREME01.png", "mascotte-walk-light.png", 760),
    ("ASSETS/MASCOTTE/PNG/MASCOTTE_BOUGE.-CREME02.png", "mascotte-lift-light.png", 760),
    ("ASSETS/MASCOTTE/PNG/MASCOTTE_BOUGE.-CREME03.png", "mascotte-run-light.png",  760),
    ("ASSETS/MASCOTTE/PNG/MASCOTTE_BOUGE.--47.png",     "mascotte-face-light.png", 512),
    # --- Stickers signature ---
    ("ASSETS/STICKERS/STICKER MOTIVATION/STICKERMOTIVATION_orange_creme.png", "sticker-motivation-orange.png", 640),
    ("ASSETS/STICKERS/STICKER MOTIVATION/STICKERMOTIVATION_vertjade_creme.png","sticker-motivation-jade.png",  640),
    ("ASSETS/STICKERS/STICKER OVALE/STICKEROVALE_vertjade_creme.png",         "sticker-ready-jade.png",       640),
    ("ASSETS/STICKERS/STICKER OVALE/STICKEROVALE_orange_creme.png",           "sticker-ready-orange.png",     640),
    ("ASSETS/STICKERS/PANCARTE/PANCARTE_orange.png",                          "pancarte-orange.png",          520),
    ("ASSETS/STICKERS/MASCOTTE/MASCOTTE_orange01.png",                        "mascotte-walk-orange.png",     640),
    ("ASSETS/STICKERS/MASCOTTE/MASCOTTE_vertjade03.png",                      "mascotte-run-jade.png",        640),
    ("ASSETS/STICKERS/MASCOTTE/MASCOTTE_bleuciel02.png",                      "mascotte-lift-sky.png",        640),
]


def trim(im: Image.Image) -> Image.Image:
    """Détoure les marges transparentes : le calage se fait ensuite en CSS."""
    box = im.getbbox()
    return im.crop(box) if box else im


def process(src_rel: str, out_name: str, width: int) -> None:
    src = SRC / src_rel
    if not src.exists():
        print(f"  ! MANQUANT : {src_rel}")
        return
    im = trim(Image.open(src).convert("RGBA"))
    if im.width > width:
        height = round(im.height * width / im.width)
        im = im.resize((width, height), Image.LANCZOS)
    # WebP avec alpha : ~2,5× plus léger que le PNG sur les aplats et les trames
    # de demi-teintes de la mascotte, pour un rendu identique à l'œil.
    dest = (OUT / out_name).with_suffix(".webp")
    im.save(dest, "WEBP", quality=90, method=6)
    print(f"  ✓ {dest.name:34s} {im.width}×{im.height}  {dest.stat().st_size // 1024} Ko")


def build_favicons() -> None:
    """Favicon + icône PWA à partir du monogramme, sur fond anthracite."""
    src = SRC / "ASSETS/STICKERS/MONOGRAMME/MONOGRAMME_orange_creme.png"
    mono = trim(Image.open(src).convert("RGBA"))

    def square(size: int, pad_ratio: float, bg):
        canvas = Image.new("RGBA", (size, size), bg)
        inner = round(size * (1 - pad_ratio * 2))
        m = mono.copy()
        m.thumbnail((inner, inner), Image.LANCZOS)
        canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
        return canvas

    anthracite = (35, 35, 35, 255)
    square(512, 0.16, anthracite).save(OUT / "icon-512.png", "PNG", optimize=True)
    square(192, 0.16, anthracite).save(OUT / "icon-192.png", "PNG", optimize=True)
    square(180, 0.14, anthracite).save(OUT / "apple-touch-icon.png", "PNG", optimize=True)
    ico = square(256, 0.14, anthracite)
    ico.save(ROOT / "public" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("  ✓ favicon.ico + icon-192/512 + apple-touch-icon")


if __name__ == "__main__":
    print("Génération des assets de marque…")
    for rel, name, w in ASSETS:
        process(rel, name, w)
    build_favicons()
    print("Terminé.")
