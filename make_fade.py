"""
Apply a smooth bottom fade to minister2-cutout.png so the bottom
blends into the website hero background color (#3D0010 dark crimson).

The existing PNG already has a transparent background.
We will:
  1. Composite the RGBA image onto the website background color
  2. Apply a cosine alpha fade starting at 60% height -> fully transparent at bottom
  So when rendered on the dark-red hero, the bottom merges naturally.
"""

from PIL import Image, ImageFilter
import numpy as np

SRC = "public/assets/minister2-cutout.png"
DST = "public/assets/minister2-cutout.png"   # overwrite in place

img  = Image.open(SRC).convert("RGBA")
data = np.array(img, dtype=np.float32)
h, w = data.shape[:2]

# ── Existing alpha channel ────────────────────────────────────────────────────
alpha = data[:, :, 3] / 255.0   # 0..1

# ── Cosine bottom fade: starts at 60%, fully transparent at 100% ─────────────
fade_start = int(h * 0.60)
fade       = np.ones(h, dtype=np.float32)
ramp_len   = h - fade_start
idx        = np.arange(fade_start, h)
fade[fade_start:] = 0.5 * (1.0 + np.cos(np.pi * (idx - fade_start) / ramp_len))

fade_2d = np.tile(fade[:, np.newaxis], (1, w))

# Multiply existing alpha by the fade
new_alpha = (alpha * fade_2d * 255).clip(0, 255).astype(np.uint8)

data[:, :, 3] = new_alpha
result = Image.fromarray(data.astype(np.uint8), mode="RGBA")
result.save(DST, format="PNG")
print("Saved:", DST, result.size)
