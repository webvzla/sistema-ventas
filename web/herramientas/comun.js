// Herramientas gratuitas de StockSoft · © 2026 StockSoft. Todos los derechos reservados.
// Funciones comunes: tasa BCV del día, formato de números y espacios de anuncios de Google AdSense.

// Identificador de Google AdSense (ca-pub-XXXXXXXXXXXXXXXX). Vacío hasta que la cuenta esté aprobada:
// mientras tanto no se carga ningún anuncio (en la versión de pruebas se ve dónde irán).
const ADSENSE_CLIENT = '';

const nf2 = new Intl.NumberFormat('es-VE', {minimumFractionDigits:2, maximumFractionDigits:2});
const nf4 = new Intl.NumberFormat('es-VE', {minimumFractionDigits:2, maximumFractionDigits:4});
const $ = s => document.querySelector(s);
// Acepta "1.234,56", "1234.56" o "1234,56".
function num(v){
  let s = String(v == null ? '' : v).trim().replace(/\s/g, '');
  if (!s) return 0;
  if (s.includes(',') && s.includes('.')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = parseFloat(s); return isFinite(n) ? n : 0;
}
const usd = n => '$' + nf2.format(n || 0);
const eur = n => '€' + nf2.format(n || 0);
const bs = n => 'Bs ' + nf2.format(n || 0);

// Tasa oficial del BCV (la misma que usa StockSoft, se actualiza sola varias veces al día).
let RATE = null;
async function loadRate(){
  for (const url of ['/app/tasas.json', 'https://stocksoft.web.app/app/tasas.json']){
    try { const r = await fetch(url + '?t=' + Date.now(), {cache:'no-store'}); if (r.ok){ const j = await r.json(); if (j.usd > 0){ RATE = j; break; } } } catch(e){}
  }
  document.querySelectorAll('[data-rate]').forEach(el => {
    el.innerHTML = RATE ? `<span class="dot"></span>Tasa oficial BCV: <b>$ ${nf4.format(RATE.usd)}</b>${RATE.eur ? ' · <b>€ ' + nf4.format(RATE.eur) + '</b>' : ''} Bs · ${RATE.dateText || ''}` : 'No se pudo cargar la tasa del BCV. Revisa tu conexión.';
  });
  return RATE;
}

function copyText(t, btn){
  navigator.clipboard.writeText(t).then(() => { if (btn){ const o = btn.textContent; btn.textContent = '¡Copiado!'; setTimeout(() => btn.textContent = o, 1400); } }, () => {});
}

// Enlace para compartir un resultado por WhatsApp (con el enlace a la herramienta).
function shareWa(text, path){
  return 'https://wa.me/?text=' + encodeURIComponent(text + '. Calcula gratis: https://stocksoft.web.app' + (path || location.pathname));
}

// "Otras herramientas" al final de cada calculadora (más visitas entre herramientas).
const TOOLS = [
  ['/herramientas/dolar-bcv/', '$', 'Dólar BCV a bolívares'],
  ['/herramientas/precio-en-bolivares/', 'Bs', 'Precio de venta en Bs'],
  ['/herramientas/iva-igtf/', '%', 'IVA e IGTF'],
  ['/herramientas/margen-ganancia/', '↗', 'Margen de ganancia'],
  ['/herramientas/codigo-de-barras/', '▥', 'Códigos de barras'],
];
function moreTools(){
  const main = document.querySelector('main .layout'); if (!main) return;
  const here = location.pathname.replace(/index\.html$/, '').replace(/([^/])$/, '$1/');
  const sec = document.createElement('section'); sec.className = 'more noprint';
  sec.innerHTML = '<h2>Otras calculadoras gratis</h2><div class="more-grid">' + TOOLS.filter(t => t[0] !== here).map(t => `<a href="${t[0]}"><span class="ico">${t[1]}</span>${t[2]}<i>→</i></a>`).join('') + '</div>';
  main.after(sec);
}

// Anuncios: <div class="ad" data-slot="1234567890"></div>
function initAds(){
  const slots = [...document.querySelectorAll('.ad')];
  const preview = /localhost|127\.0\.0\.1|--pruebas/.test(location.hostname);
  if (!ADSENSE_CLIENT){ if (preview) slots.forEach(s => { s.classList.add('preview'); s.textContent = 'Espacio para anuncio (Google AdSense)'; }); return; }
  const sc = document.createElement('script');
  sc.async = true; sc.crossOrigin = 'anonymous';
  sc.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
  document.head.appendChild(sc);
  slots.forEach(s => {
    s.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_CLIENT}" ${s.dataset.slot ? `data-ad-slot="${s.dataset.slot}"` : ''} data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch(e){}
  });
}
document.addEventListener('DOMContentLoaded', () => { moreTools(); initAds(); const y = $('#year'); if (y) y.textContent = new Date().getFullYear(); });
