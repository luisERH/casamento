const fs = require('fs');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

const W = 680, H = 1760;

// bands: [base(dark/shaded), tip(light/lit)] — cool/blue-green at back, warm/yellow-green at front
const BANDS = [
  ['#143026','#1d3f2c'],  // 0 deepest, coolest (back, blurred)
  ['#173a2a','#264e34'],  // 1
  ['#21472c','#386036'],  // 2 mid
  ['#2f5d33','#4f7e40'],  // 3
  ['#3f6e3a','#79994a'],  // 4 front, warmer
  ['#56823f','#9bbd5a'],  // 5 frontmost, sunlit yellow-green
];
const SUN   = ['#6a9244','#aecb6e'];   // sunlit accent (front)
const SHADE = ['#1c3826','#2c4a34'];   // cool shadow accent (front)
const AUT   = ['#7c5a30','#bd934e'];   // dried/autumn leaf
const BUR   = ['#5e3328','#8a4a33'];   // burgundy/terracotta echo

function leafShape(type, L, wr, curl){
  const Wd=L*wr, tx=curl*L;
  const f=(n)=>n.toFixed(1);
  if(type==='lan'){ const w=L*0.23;
    return `M0 0 C ${f(w)} ${f(-L*0.3)} ${f(w*0.5+tx)} ${f(-L*0.82)} ${f(tx)} ${f(-L)} C ${f(-w*0.5+tx)} ${f(-L*0.82)} ${f(-w)} ${f(-L*0.3)} 0 0 Z`; }
  if(type==='cor'){ const w=L*Math.max(0.52,wr);
    return `M0 0 C ${f(w*0.45)} ${f(L*0.05)} ${f(w)} ${f(-L*0.22)} ${f(w*0.74)} ${f(-L*0.56)} C ${f(w*0.46+tx)} ${f(-L*0.9)} ${f(tx)} ${f(-L)} ${f(tx)} ${f(-L)} C ${f(tx)} ${f(-L)} ${f(-w*0.46+tx)} ${f(-L*0.9)} ${f(-w*0.74)} ${f(-L*0.56)} C ${f(-w)} ${f(-L*0.22)} ${f(-w*0.45)} ${f(L*0.05)} 0 0 Z`; }
  if(type==='asy'){ const w=Wd;
    return `M0 0 C ${f(w*1.18)} ${f(-L*0.32)} ${f(w*0.6+tx)} ${f(-L*0.86)} ${f(tx)} ${f(-L)} C ${f(-w*0.48+tx)} ${f(-L*0.84)} ${f(-w*0.82)} ${f(-L*0.34)} 0 0 Z`; }
  return `M0 0 C ${f(Wd)} ${f(-L*0.34)} ${f(Wd*0.6+tx)} ${f(-L*0.86)} ${f(tx)} ${f(-L)} C ${f(-Wd*0.6+tx)} ${f(-L*0.86)} ${f(-Wd)} ${f(-L*0.34)} 0 0 Z`;
}

function build(seed){
  const rnd = mulberry32(seed);
  const r = (a,b)=>a+(b-a)*rnd();
  const pick = arr => arr[(rnd()*arr.length)|0];
  const grad = (id,c)=>`<linearGradient id="${id}" x1="0" y1="1" x2="0.35" y2="0.05"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient>`;

  let defs = '';
  BANDS.forEach((c,i)=> defs += grad('g'+i,c));
  defs += grad('gsun',SUN)+grad('gshade',SHADE)+grad('gaut',AUT)+grad('gbur',BUR);
  defs += `<linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#11241a"/><stop offset="0.5" stop-color="#0d1e14"/><stop offset="1" stop-color="#091610"/></linearGradient>`;
  defs += `<radialGradient id="light" cx="0.4" cy="0.16" r="0.95"><stop offset="0" stop-color="#fff" stop-opacity="0.17"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.03"/><stop offset="1" stop-color="#000" stop-opacity="0.34"/></radialGradient>`;
  defs += `<filter id="b6" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>`;
  defs += `<filter id="b3" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>`;
  defs += `<filter id="b1"><feGaussianBlur stdDeviation="0.9"/></filter>`;
  defs += `<filter id="drop" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#08160d" flood-opacity="0.4"/></filter>`;

  const layers = [
    {band:0,n:78, smin:120,smax:230,blur:'b6',vein:false,front:false},
    {band:1,n:92, smin:95, smax:188,blur:'b3',vein:false,front:false},
    {band:2,n:108,smin:80, smax:150,blur:'b1',vein:false,front:false},
    {band:3,n:118,smin:66, smax:128,blur:null,vein:false,front:false},
    {band:4,n:118,smin:54, smax:108,blur:null,vein:true, front:true},
    {band:5,n:96, smin:44, smax:92, blur:null,vein:true, front:true},
  ];
  const shapes=['ov','ov','lan','cor','asy'];

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">`;
  svg += `<defs>${defs}</defs>`;
  svg += `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;

  for (const ly of layers){
    // cluster centers for organic clumping
    const cn = 11, cl = [];
    for(let i=0;i<cn;i++) cl.push([r(-20,W+20), r(-20,H+20)]);
    const gauss=()=> (rnd()+rnd()+rnd()-1.5)/1.5; // ~[-1,1] bell
    let g = `<g${ly.blur?` filter="url(#${ly.blur})"`:''}${ly.front?` filter="url(#drop)"`:''}>`;
    // (note: one filter attr wins; apply drop only to front, blur only to back — never both)
    if(ly.blur) g = `<g filter="url(#${ly.blur})">`;
    else if(ly.front) g = `<g filter="url(#drop)">`;
    else g = `<g>`;
    for (let k=0;k<ly.n;k++){
      let x,y;
      if(rnd()<0.6){ const c=cl[(rnd()*cn)|0], R=130; x=c[0]+gauss()*R; y=c[1]+gauss()*R; }
      else { x=r(-30,W+30); y=r(-30,H+30); }
      const L=r(ly.smin,ly.smax), wr=r(0.30,0.58), curl=r(-0.12,0.12);
      const rot=r(0,360), sx=rnd()<0.5?1:-1, type=pick(shapes);
      // colour selection
      let fill, op;
      const roll=rnd();
      if(ly.front && roll<0.025){ fill='url(#gaut)'; op=0.92; }
      else if(ly.front && roll<0.035){ fill='url(#gbur)'; op=0.95; }
      else if(ly.front && roll<0.18){ fill='url(#gsun)'; op=ly.band===5?1:0.96; }
      else if(ly.front && roll<0.32){ fill='url(#gshade)'; op=0.95; }
      else { fill=`url(#g${ly.band})`; op = ly.front? r(0.95,1) : r(0.86,1); }
      g += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sx} 1)">`;
      g += `<path d="${leafShape(type,L,wr,curl)}" fill="${fill}" fill-opacity="${op.toFixed(2)}"/>`;
      if (ly.vein){
        const vc = (fill.includes('aut')||fill.includes('bur'))?'#4a3018':BANDS[ly.band][0];
        g += `<path d="M0 -2 L${(curl*L*0.6).toFixed(1)} ${(-L+4).toFixed(1)}" stroke="${vc}" stroke-width="${(L*0.02+0.7).toFixed(2)}" stroke-opacity="0.55" fill="none" stroke-linecap="round"/>`;
        g += `<path d="M0 ${(-L*0.4).toFixed(1)} Q ${(L*wr*0.4).toFixed(1)} ${(-L*0.5).toFixed(1)} ${(L*wr*0.55).toFixed(1)} ${(-L*0.66).toFixed(1)} M0 ${(-L*0.4).toFixed(1)} Q ${(-L*wr*0.4).toFixed(1)} ${(-L*0.5).toFixed(1)} ${(-L*wr*0.55).toFixed(1)} ${(-L*0.66).toFixed(1)} M0 ${(-L*0.62).toFixed(1)} Q ${(L*wr*0.34).toFixed(1)} ${(-L*0.7).toFixed(1)} ${(L*wr*0.46).toFixed(1)} ${(-L*0.82).toFixed(1)} M0 ${(-L*0.62).toFixed(1)} Q ${(-L*wr*0.34).toFixed(1)} ${(-L*0.7).toFixed(1)} ${(-L*wr*0.46).toFixed(1)} ${(-L*0.82).toFixed(1)}" stroke="${vc}" stroke-width="0.6" stroke-opacity="0.4" fill="none"/>`;
      }
      g += `</g>`;
    }
    g += `</g>`;
    svg += g;
  }
  svg += `<rect width="${W}" height="${H}" fill="url(#light)"/>`;
  svg += `</svg>`;
  return svg;
}

fs.writeFileSync('images/foliage-l.svg', build(20260829));
fs.writeFileSync('images/foliage-r.svg', build(81529204));
console.log('foliage v2 written');
