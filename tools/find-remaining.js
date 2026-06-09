const sharp = require('sharp');
(async () => {
  const { data, info } = await sharp('images/logo.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels: ch } = info;
  const out = Buffer.from(data);
  // row histogram of remaining rose pixels
  const rows = new Array(height).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y*width+x;
      if (data[i*ch+3] < 16) continue;
      const r=data[i*ch],g=data[i*ch+1],b=data[i*ch+2];
      const l=0.299*r+0.587*g+0.114*b;
      if (l>120 && l<235){ rows[y]++; out[i*ch]=255;out[i*ch+1]=0;out[i*ch+2]=0;out[i*ch+3]=255; }
    }
  }
  // print rows with rose, grouped
  let segs=[], inSeg=false, s=0;
  for(let y=0;y<height;y++){ const on=rows[y]>30; if(on&&!inSeg){inSeg=true;s=y;} if(!on&&inSeg){inSeg=false;segs.push([s,y-1]);} }
  if(inSeg)segs.push([s,height-1]);
  console.log('rose row-bands (y0,y1,frac0,frac1):');
  segs.forEach(([a,b])=>console.log(a,b,(a/height).toFixed(3),(b/height).toFixed(3)));
  await sharp(out,{raw:{width,height,channels:ch}}).png().toFile('/tmp/logo_remaining.png');
  const lg=await sharp('/tmp/logo_remaining.png').resize(700).toBuffer();
  await sharp({create:{width:740,height:300,channels:4,background:{r:225,g:206,b:164,alpha:1}}})
    .composite([{input:lg,gravity:'center'}]).png().toFile('/tmp/logo_remaining_prev.png');
})();
