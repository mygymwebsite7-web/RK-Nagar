from PIL import Image
import numpy as np
from collections import deque

# Source image with pure black background
img = Image.open("WhatsApp Image 2026-08-20 at 14.23.02.jpeg").convert("RGBA")
w, h = img.size
data = np.array(img)

alpha = np.ones((h, w), dtype=np.uint8) * 255

# Ultra-strict background: must be near-absolute black (brightness < 18, spread < 10)
# This ensures dark hair (which has some warmth/texture) is NEVER removed
def is_bg(r, g, b):
    r, g, b = int(r), int(g), int(b)
    brightness = (r + g + b) / 3
    spread = max(r, g, b) - min(r, g, b)
    return brightness < 18 and spread < 10

visited = np.zeros((h, w), dtype=bool)
queue = deque()

# Seed from ALL border pixels that qualify as background
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

# BFS flood fill — only pure black pixels become transparent
while queue:
    y, x = queue.popleft()
    alpha[y, x] = 0
    for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
        ny, nx = y+dy, x+dx
        if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
            r, g, b = data[ny,nx,0], data[ny,nx,1], data[ny,nx,2]
            if is_bg(r, g, b):
                visited[ny, nx] = True
                queue.append((ny, nx))

# NO feathering at all — preserve 100% of dark hair pixels
data[:,:,3] = alpha
result = Image.fromarray(data)
result.save("public/assets/mla4-cutout.png", "PNG")
print("Done — full black hair preserved.")
