const sharp = require('sharp');
const path  = require('path');

const input  = path.join(__dirname, 'WhatsApp Image 2026-08-24 at 17.59.56 (1).jpeg');
const output = path.join(__dirname, 'public/assets/minister2-cutout.png');

const WHITE_HARD = 230;
const WHITE_SOFT = 195;

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
      const minCh = Math.min(r, g, b);

      if (minCh >= WHITE_HARD) {
        buf[idx+3] = 0;
      } else if (minCh >= WHITE_SOFT) {
        const t = (minCh - WHITE_SOFT) / (WHITE_HARD - WHITE_SOFT);
        buf[idx+3] = Math.round((1 - t) * 255);
      }
    }

    return sharp(buf, { raw: { width, height, channels } })
      .png()
      .toFile(output);
  })
  .then(() => console.log('Done → public/assets/minister2-cutout.png'))
  .catch(err => { console.error(err); process.exit(1); });
