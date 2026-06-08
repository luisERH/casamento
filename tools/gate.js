const fs = require('fs');
function mul(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// painel vazado estilo corte-a-laser (vinhas + folhas), aspecto ~ gate-half (0.36)
const W = 300, H = 830;
const GREEN = '#5e6e34';

function leaf(L, wr, curl){
  const w=L*wr, tx=curl*L, f=n=>n.toFixed(1);
  return `M0 0 C ${f(w)} ${f(-L*0.26)} ${f(w*0.52+tx)} ${f(-L*0.8)} ${f(tx)} ${f(-L)} `
       + `C ${f(-w*0.52+tx)} ${f(-L*0.8)} ${f(-w)} ${f(-L*0.26)} 0 0 Z`;
}

function build(seed, mirror){
  const rnd = mul(seed); const r=(a,b)=>a+(b-a)*rnd();
  let body = '';
  const sgn = mirror ? -1 : 1;

  const nV = 4;
  for(let v=0; v<nV; v++){
    const baseX = 30 + v*(W-60)/(nV-1);
    const amp = r(16,30), freq = r(0.012,0.02), phase = r(0,6.28);
    const vineX = y => baseX + Math.sin(y*freq+phase)*amp*sgn;
    // caule (stem) ondulado, conectado topo->base
    let d = `M ${vineX(-20).toFixed(1)} -20`;
    for(let y=0;y<=H+20;y+=24) d += ` L ${vineX(y).toFixed(1)} ${y}`;
    body += `<path d="${d}" fill="none" stroke="${GREEN}" stroke-width="${r(7,10).toFixed(1)}" stroke-linecap="round"/>`;
    // folhas ao longo do caule, alternando lados, apontando p/ cima-e-fora
    let side = rnd()<0.5?1:-1;
    for(let y=r(24,56); y<H-10; y+=r(52,74)){
      const x = vineX(y);
      const L = r(50,84), wr = r(0.36,0.5), curl = r(0.05,0.16)*side;
      const ang = side*sgn*r(42,72);        // graus, abre p/ fora
      body += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(ang).toFixed(1)})"><path d="${leaf(L,wr,curl*side)}" fill="${GREEN}"/></g>`;
      // folha menor oposta às vezes
      if(rnd()<0.3){ const L2=r(30,52), a2=-side*sgn*r(40,66);
        body += `<g transform="translate(${x.toFixed(1)} ${(y+r(-6,6)).toFixed(1)}) rotate(${a2.toFixed(1)})"><path d="${leaf(L2,r(0.36,0.48),r(0.04,0.14)*-side)}" fill="${GREEN}"/></g>`; }
      side = -side;
    }
  }
  // moldura
  const frame = `<rect x="7" y="7" width="${W-14}" height="${H-14}" fill="none" stroke="${GREEN}" stroke-width="13"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="none">`
    + `<defs><filter id="sh" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0a2412" flood-opacity="0.45"/></filter></defs>`
    + `<g filter="url(#sh)">${body}${frame}</g></svg>`;
}

fs.writeFileSync('images/gate-l.svg', build(20260829, false));
fs.writeFileSync('images/gate-r.svg', build(7714220, true));
console.log('gate panels written');
