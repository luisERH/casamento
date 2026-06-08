const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('images/logo.svg', 'utf8');
const m = svg.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
if (!m) { console.error('no embedded png'); process.exit(1); }
const png = Buffer.from(m[1], 'base64');

const COL = [62, 26, 12]; // espresso #3e1a0c

(async () => {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const lum = (i) => 0.299*data[i*channels] + 0.587*data[i*channels+1] + 0.114*data[i*channels+2];
  // background luminance from a corner
  const bg = lum(0);
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const origA = data[i*channels+3];
    const l = lum(i);
    // darker-than-bg -> opaque espresso; light bg -> transparent
    let a = Math.max(0, Math.min(1, (bg - 18 - l) / 45)) * 1.5;   // boost for bolder strokes
    a = Math.min(1, a) * (origA / 255);
    out[i*4] = COL[0]; out[i*4+1] = COL[1]; out[i*4+2] = COL[2]; out[i*4+3] = Math.round(a * 255);
  }
  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile('images/logo_seal.png');
  // preview on gold
  const lg = await sharp('images/logo_seal.png').resize(360).toBuffer();
  await sharp({ create: { width: 420, height: 220, channels: 4, background: { r:207,g:176,b:105,alpha:1 } } })
    .composite([{ input: lg, gravity: 'center' }]).png().toFile('/tmp/seal_prev.png');
  console.log('bg lum', bg.toFixed(0), '->', width, 'x', height);
})().catch(e => { console.error(e); process.exit(1); });
