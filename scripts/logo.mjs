// Genera el logo StockSoft en SVG: símbolo (cajas isométricas en escalera + tendencia naranja +
// flecha de crecimiento) y versiones con nombre para fondo claro y oscuro.
import { writeFileSync } from 'fs';
const OUT = process.argv[2];
const C = { navy: '#0f2a5c', blue: '#1d5fd6', sky: '#2f8cf0', cyan: '#3cc8f2', orange: '#ff8a1f', orange2: '#ffb347' };
const k = 0.866;
// Caja isométrica: cara superior clara, izquierda media, derecha oscura.
function box(cx, cy, s, id) {
  const top = [[cx, cy - s / 2], [cx + k * s, cy], [cx, cy + s / 2], [cx - k * s, cy]];
  const left = [[cx - k * s, cy], [cx, cy + s / 2], [cx, cy + s * 1.5], [cx - k * s, cy + s]];
  const right = [[cx, cy + s / 2], [cx + k * s, cy], [cx + k * s, cy + s], [cx, cy + s * 1.5]];
  const p = a => a.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  return `<g>
    <polygon points="${p(left)}" fill="url(#gL)"/>
    <polygon points="${p(right)}" fill="url(#gR)"/>
    <polygon points="${p(top)}" fill="url(#gT)"/>
    <polyline points="${p([[cx - k * s * .5, cy - s * .25], [cx + k * s * .5, cy + s * .25]])}" stroke="rgba(255,255,255,.55)" stroke-width="${(s * .07).toFixed(2)}" stroke-linecap="round"/>
    <polyline points="${p([left[1], left[2]])}" stroke="rgba(255,255,255,.18)" stroke-width="${(s * .03).toFixed(2)}"/>
  </g>`;
}
const defs = `<defs>
  <linearGradient id="gT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd6ff"/><stop offset="1" stop-color="${C.sky}"/></linearGradient>
  <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.blue}"/><stop offset="1" stop-color="#1546a8"/></linearGradient>
  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#143f96"/><stop offset="1" stop-color="${C.navy}"/></linearGradient>
  <linearGradient id="gA" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${C.sky}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient>
  <linearGradient id="gO" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.orange}"/><stop offset="1" stop-color="${C.orange2}"/></linearGradient>
  <linearGradient id="gBg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#132a57"/><stop offset="1" stop-color="#070d1c"/></linearGradient>
  <radialGradient id="gGlow" cx=".75" cy=".2" r=".7"><stop offset="0" stop-color="rgba(60,200,242,.35)"/><stop offset="1" stop-color="rgba(60,200,242,0)"/></radialGradient>
</defs>`;
// Símbolo en una caja de 100x100
function mark() {
  const s = 19;
  return `
  <!-- flecha de crecimiento -->
  <path d="M38 60 L80 18" stroke="url(#gA)" stroke-width="12" stroke-linecap="round"/>
  <polygon points="93,5 90,32 66,8" fill="${C.cyan}"/>
  ${box(66, 34, s)}
  ${box(47, 47, s)}
  ${box(28, 60, s)}
  <!-- tendencia de ventas -->
  <polyline points="8,84 25,64 40,73 58,50 73,57 88,36" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
  <polyline points="8,84 25,64 40,73 58,50 73,57 88,36" fill="none" stroke="url(#gO)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="96,25 92,41 82,31" fill="${C.orange2}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
  ${[[8, 84], [25, 64], [40, 73], [58, 50], [73, 57]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${C.orange}" stroke="#fff" stroke-width="2"/>`).join('')}`;
}
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${defs}
  <rect width="512" height="512" rx="112" fill="url(#gBg)"/><rect width="512" height="512" rx="112" fill="url(#gGlow)"/>
  <rect x="3" y="3" width="506" height="506" rx="109" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
  <g transform="translate(52 46) scale(4.1)">${mark()}</g></svg>`;
const markOnly = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 98 98">${defs}${mark()}</svg>`;
const word = (dark) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 104">${defs}
  <g transform="translate(-4 -2) scale(1.2)">${mark()}</g>
  <text x="128" y="74" font-family="Montserrat, 'Segoe UI', sans-serif" font-weight="800" font-size="58" letter-spacing="1"><tspan fill="${dark ? '#ffffff' : C.navy}">STOCK</tspan><tspan fill="${dark ? C.cyan : C.blue}" font-weight="600">SOFT</tspan></text></svg>`;
writeFileSync(`${OUT}/stocksoft-icono.svg`, icon);
writeFileSync(`${OUT}/stocksoft-simbolo.svg`, markOnly);
writeFileSync(`${OUT}/stocksoft-logo-claro.svg`, word(false));
writeFileSync(`${OUT}/stocksoft-logo-oscuro.svg`, word(true));
console.log('ok');
