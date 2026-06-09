const sharp = require('sharp');
(async () => {
  const { data, info } = await sharp('images/logo.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels: ch } = info;
  console.log('dim', width, height, ch);
  let dark = [], light = [];
  for (let i = 0; i < width * height; i++) {
    const a = data[i*ch+3]; if (a < 60) continue;
    const r = data[i*ch], g = data[i*ch+1], b = data[i*ch+2];
    const l = 0.299*r + 0.587*g + 0.114*b;
    if (l < 110) dark.push([r,g,b,i%width,(i/width)|0]);
    else if (l < 215) light.push([r,g,b,i%width,(i/width)|0]);
  }
  const avg = a => { let s=[0,0,0]; a.forEach(p=>{s[0]+=p[0];s[1]+=p[1];s[2]+=p[2];}); return s.map(x=>Math.round(x/a.length)); };
  const bnd = a => { let x0=1e9,x1=0,y0=1e9,y1=0; a.forEach(p=>{x0=Math.min(x0,p[3]);x1=Math.max(x1,p[3]);y0=Math.min(y0,p[4]);y1=Math.max(y1,p[4]);}); return [x0,x1,y0,y1]; };
  console.log('dark  n', dark.length, 'avg', avg(dark), 'bounds', bnd(dark));
  console.log('light n', light.length, 'avg', avg(light), 'bounds', bnd(light));
})();
