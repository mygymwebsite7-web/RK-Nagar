from PIL import Image
import numpy as np
from collections import deque

# Use the new source image (black background, intact hair)
img = Image.open("WhatsApp Image 2026-08-20 at 14.23.02.jpeg").convert("RGBA")
w, h = img.size
data = np.array(img)

# Build alpha channel — start fully opaque
alpha = np.ones((h, w), dtype=np.uint8) * 255

# --- Flood-fill background from all 4 corners ---
# Strict threshold: pure/near-pure black background pixels only
# The background is very close to (0,0,0); hair pixels are dark but warmer/brighter
def is_bg(r, g, b):
    r, g, b = int(r), int(g), int(b)
    # Must be very dark overall AND near-neutral (no warm brown/blue tones typical of hair)
    brightness = (r + g + b) / 3
    # Max channel spread — hair tends to have some warmth; pure black background does not
    spread = max(r, g, b) - min(r, g, b)
    return brightness < 35 and spread < 15

visited = np.zeros((h, w), dtype=bool)
queue = deque()

# Seed from all border pixels that are background
for x in range(w):
    for y in [0, h-1]:
        if not visited[y, x] and is_bg(data[y,x,0], data[y,x,1], data[y,x,2]):
            queue.append((y, x))
            visited[y, x] = True
for y in range(h):
    for x in [0, w-1]:
        if not visited[y, x] and is_bg(data[y,x,0], data[y,x,1], data[y,x,2]):
            queue.append((y, x))
            visited[y, x] = True

# BFS flood fill
while queue:
    y, x = queue.popleft()
    alpha[y, x] = 0  # make transparent
    for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
        ny, nx = y+dy, x+dx
        if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
            r, g, b = data[ny,nx,0], data[ny,nx,1], data[ny,nx,2]
            if is_bg(r, g, b):
                visited[ny, nx] = True
                queue.append((ny, nx))

# Gentle 1-pixel edge feather only for pixels that are truly background-dark
# (brightness < 40) at the boundary — avoids erasing dark hair
for y in range(1, h-1):
    for x in range(1, w-1):
        if alpha[y, x] == 255:
            neighbours = [alpha[y+dy, x+dx] for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]]
            if any(n == 0 for n in neighbours):
                r, g, b = int(data[y,x,0]), int(data[y,x,1]), int(data[y,x,2])
                brightness = (r + g + b) / 3
                spread = max(r, g, b) - min(r, g, b)
                # Only feather pixels that look like background (very dark, neutral)
                if brightness < 30 and spread < 12:
                    alpha[y, x] = int(brightness * 4)

data[:,:,3] = alpha
result = Image.fromarray(data)
result.save("public/assets/mla4-cutout.png", "PNG")
print("Done — mla4-cutout.png saved with intact hair.")
