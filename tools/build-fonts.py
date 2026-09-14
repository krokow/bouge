#!/usr/bin/env python3
"""
Convertit les polices de la charte (TTF/OTF) en WOFF2 pour un chargement web rapide.

Sun Motter (Creative Market) est une police sous licence appartenant au client :
elle est auto-hébergée ici pour son propre site, conformément à sa licence.
Manrope et Reenie Beanie sont des Google Fonts (SIL Open Font License).

    python3 tools/build-fonts.py
"""
from pathlib import Path
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "BOUGE-charte graphique" / "FONTS"
OUT = ROOT / "public" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

FONTS = [
    ("MANROPE/Manrope-Light.ttf",        "Manrope-Light.woff2"),
    ("MANROPE/Manrope-Regular.ttf",      "Manrope-Regular.woff2"),
    ("MANROPE/Manrope-Medium.ttf",       "Manrope-Medium.woff2"),
    ("MANROPE/Manrope-SemiBold.ttf",     "Manrope-SemiBold.woff2"),
    ("MANROPE/Manrope-Bold.ttf",         "Manrope-Bold.woff2"),
    ("REENIE BEANIE/ReenieBeanie-Regular.ttf", "ReenieBeanie-Regular.woff2"),
    ("SUN MOTTER/SunMotter.otf",         "SunMotter.woff2"),
]

for rel, out_name in FONTS:
    src = SRC / rel
    if not src.exists():
        print(f"  ! MANQUANT : {rel}")
        continue
    font = TTFont(src)
    font.flavor = "woff2"
    dest = OUT / out_name
    font.save(dest)
    print(f"  ✓ {out_name:30s} {dest.stat().st_size // 1024} Ko")
