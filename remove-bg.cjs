const sharp = require('sharp');
const path  = require('path');

// Use the white-background version — much cleaner for bg removal
const input  = path.join(__dirname, '..', 'WhatsApp Image 2026-08-20 at 14.15.50.jpeg');
const output = path.join(__dirname, 'public/assets/mla3-cutout.png');

// Remove white / near-white background.
// Pixels where ALL channels are high (bright) become transparent.
// Pixels on the soft boundary get partial alpha for anti-aliasing.
const WHITE_HARD = 230; // fully transparent above this brightness
const WHITE_SOFT = 195; // start of feather zone

sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    const { width, height, channels } = info;
    const buf = Buffer.from(data);

    for (let i = 0; i < width * height; i++) {
      const idx = i * channels;
      const r = buf[idx], g = buf[idx+1], b = buf[idx+2];

      // Brightness = minimum channel value (all channels high → white)
      const minCh = Math.min(r, g, b);

      if (minCh >= WHITE_HARD) {
        buf[idx+3] = 0; // fully transparent (white bg)
      } else if (minCh >= WHITE_SOFT) {
        // feather: 255 at WHITE_SOFT → 0 at WHITE_HARD
        const t = (minCh - WHITE_SOFT) / (WHITE_HARD - WHITE_SOFT);
        buf[idx+3] = Math.round((1 - t) * 255);
      }
      // else: subject pixel — leave fully opaque
    }

    return sharp(buf, { raw: { width, height, channels } })
      .png()
      .toFile(output);
  })
  .then(() => console.log('Done → public/assets/mla3-cutout.png'))
  .catch(err => { console.error(err); process.exit(1); });
