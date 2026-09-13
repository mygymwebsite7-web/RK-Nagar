"""
Normalise mla4-cutout.png and leader-cutout.png to the same canvas size
so they appear visually equal on the poster.

Strategy:
- Target canvas: 520 x 620 px (portrait)
- Fit each image INTO that canvas (preserve aspect ratio, align top-center)
- No crop — just scale down to fit, then center on transparent canvas
"""
from PIL import Image

TARGET_W, TARGET_H = 520, 620

def normalise(src, dst):
    img = Image.open(src).convert("RGBA")
    iw, ih = img.size

    # Scale to fit inside target, preserving aspect ratio
    scale = min(TARGET_W / iw, TARGET_H / ih)
    new_w = int(iw * scale)
    new_h = int(ih * scale)
    img_resized = img.resize((new_w, new_h), Image.LANCZOS)

    # Place top-center on the canvas
    canvas = Image.new("RGBA", (TARGET_W, TARGET_H), (0, 0, 0, 0))
    x_off = (TARGET_W - new_w) // 2
    y_off = 0   # align to top
    canvas.paste(img_resized, (x_off, y_off), img_resized)
    canvas.save(dst, format="PNG")
    print(f"{src} ({iw}x{ih}) -> {dst} ({TARGET_W}x{TARGET_H})")

normalise("public/assets/mla4-cutout.png",   "public/assets/mla4-cutout.png")
normalise("public/assets/leader-cutout.png",  "public/assets/leader-cutout.png")
