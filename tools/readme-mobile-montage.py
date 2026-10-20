#!/usr/bin/env python3
"""Compone docs/assets/movil.png (tres teléfonos con marco) a partir de las capturas
movil-inicio.png, movil-comercios.png y movil-mapa.png que genera readme-screenshots.cjs.

Uso: python3 tools/readme-mobile-montage.py [carpeta]   (por defecto docs/assets; requiere Pillow)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

folder = Path(sys.argv[1] if len(sys.argv) > 1 else "docs/assets")
names = ["movil-inicio", "movil-comercios", "movil-mapa"]
scale, bezel, radius, gap = 0.78, 10, 38, 70

pw, ph = int(390 * scale), int(844 * scale)
width, height = 1280, ph + 2 * bezel + 90
canvas = Image.new("RGBA", (width, height), (251, 250, 240, 255))
x0 = (width - (3 * (pw + 2 * bezel) + 2 * gap)) // 2
y0 = 45

for i, name in enumerate(names):
    shot = Image.open(folder / f"{name}.png").convert("RGBA").resize((pw, ph), Image.LANCZOS)
    x = x0 + i * (pw + 2 * bezel + gap)

    shadow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (x + 6, y0 + 16, x + pw + 2 * bezel + 6, y0 + ph + 2 * bezel + 16), radius=radius + bezel, fill=(18, 53, 36, 90)
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))

    ImageDraw.Draw(canvas).rounded_rectangle(
        (x, y0, x + pw + 2 * bezel, y0 + ph + 2 * bezel), radius=radius + bezel, fill=(18, 53, 36, 255)
    )
    mask = Image.new("L", (pw, ph), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, pw, ph), radius=radius, fill=255)
    canvas.paste(shot, (x + bezel, y0 + bezel), mask)

canvas.convert("RGB").save(folder / "movil.png", optimize=True)
print("✔", folder / "movil.png")
