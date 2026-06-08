// Embute os SVGs dos painéis direto no HTML (renderiza no 1º paint, sem flash)
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const fix = svg => svg.trim().replace('width="300" height="830"',
  'width="100%" height="100%" style="position:absolute;inset:0;display:block"');
const sl = fix(fs.readFileSync('images/gate-l.svg', 'utf8'));
const sr = fix(fs.readFileSync('images/gate-r.svg', 'utf8'));
html = html.replace(/<div class="leaf l">[\s\S]*?<\/div>/, `<div class="leaf l">${sl}</div>`);
html = html.replace(/<div class="leaf r">[\s\S]*?<\/div>/, `<div class="leaf r">${sr}</div>`);
// remove o background-image (não precisa mais; evita fetch assíncrono)
html = html.replace('background-image:url(images/gate-l.svg);', '');
html = html.replace('background-image:url(images/gate-r.svg);', '');
fs.writeFileSync('index.html', html);
console.log('inlined gate panels');
