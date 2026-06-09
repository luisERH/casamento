const sharp = require('sharp');

(async () => {
  const src = 'images/logo_orig_backup.png';
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels: ch } = info;

  // --- representative I/L color: median of the solid-dark core pixels ---
  const core = [];
  for (let i = 0; i < width * height; i++) {
    if (data[i*ch+3] < 230) continue;
    const r = data[i*ch], g = data[i*ch+1], b = data[i*ch+2];
    const l = 0.299*r + 0.587*g + 0.114*b;
    if (l < 110) core.push([r, g, b]);
  }
  const med = k => { const a = core.map(p => p[k]).sort((x,y)=>x-y); return a[a.length>>1]; };
  const TARGET = core.length ? [med(0), med(1), med(2)] : [123, 42, 19];
  console.log('core n', core.length, 'TARGET I/L color', TARGET);

  const out = Buffer.from(data); // copy
  let changed = 0;
  const recolor = (x0, x1, y0, y1) => {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * width + x;
        const a = data[i*ch+3]; if (a < 16) continue;
        const r = data[i*ch], g = data[i*ch+1], b = data[i*ch+2];
        const l = 0.299*r + 0.587*g + 0.114*b;
        // rose family only (skip anything already dark like a stray I/L pixel)
        if (l > 120 && l < 235) {
          out[i*ch] = TARGET[0]; out[i*ch+1] = TARGET[1]; out[i*ch+2] = TARGET[2];
          changed++;
        }
      }
    }
  };

  // Recolor every rose pixel of the logo — house, heart, the full wave-line
  // flourish AND the "Iasmin & Luis" script — so the whole mark is one tone,
  // matching the I and L letters.
  recolor(0, width - 1, 0, height - 1);

  console.log('recolored px', changed);

  await sharp(out, { raw: { width, height, channels: ch } }).png().toFile('images/logo.png');

  // small preview on parchment so I can eyeball it
  const lg = await sharp('images/logo.png').resize(600).toBuffer();
  await sharp({ create: { width: 660, height: 280, channels: 4, background: { r:225, g:206, b:164, alpha:1 } } })
    .composite([{ input: lg, gravity: 'center' }]).png().toFile('/tmp/logo_prev.png');
})();
