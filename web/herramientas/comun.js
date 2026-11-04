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
// La persona también puede poner su propia tasa del dólar y del euro (se guarda en este navegador).
let RATE = null, OFFICIAL = null;
const MANUAL_KEY = 'ss_tasa_manual';
function getManual(){ try { const m = JSON.parse(localStorage.getItem(MANUAL_KEY) || 'null'); return m && (m.usd > 0 || m.eur > 0) ? m : null; } catch(e){ return null; } }
function setManual(m){ try { m ? localStorage.setItem(MANUAL_KEY, JSON.stringify(m)) : localStorage.removeItem(MANUAL_KEY); } catch(e){} }
function applyRate(){
  const m = getManual();
  if (m){
    const base = OFFICIAL || {};
    RATE = {...base, usd: m.usd > 0 ? m.usd : base.usd, eur: m.eur > 0 ? m.eur : base.eur, manual: true};
    if (!(RATE.usd > 0)) RATE = null;
  } else RATE = OFFICIAL;
  renderRate();
  if (typeof onRate === 'function') onRate(RATE);
  if (typeof calc === 'function') calc();
}
async function loadRate(){
  for (const url of ['/app/tasas.json', 'https://stocksoft.web.app/app/tasas.json']){
    try { const r = await fetch(url + '?t=' + Date.now(), {cache:'no-store'}); if (r.ok){ const j = await r.json(); if (j.usd > 0){ OFFICIAL = j; break; } } } catch(e){}
  }
  RATE_LOADED = true;
  applyRate();
  return RATE;
}
let RATE_LOADED = false, rateFormOpen = false;
function staleDays(){ if (!OFFICIAL || !OFFICIAL.dateISO) return 0; return Math.floor((Date.now() - new Date(OFFICIAL.dateISO + 'T12:00:00').getTime()) / 864e5); }
function renderRate(){
  document.querySelectorAll('[data-rate]').forEach(el => {
    const m = getManual();
    let txt;
    if (m && RATE) txt = `<span class="dot man"></span>Tu tasa: <b>$ ${nf4.format(RATE.usd)}</b>${RATE.eur ? ' · <b>€ ' + nf4.format(RATE.eur) + '</b>' : ''} Bs <span class="rtag">manual</span>`;
    else if (RATE) txt = `<span class="dot"></span>Tasa oficial BCV: <b>$ ${nf4.format(RATE.usd)}</b>${RATE.eur ? ' · <b>€ ' + nf4.format(RATE.eur) + '</b>' : ''} Bs · ${RATE.dateText || ''}`;
    else txt = RATE_LOADED ? '<span class="dot off"></span>No se pudo cargar la tasa del BCV. Escríbela a mano:' : 'Cargando la tasa del BCV…';
    const stale = !m && RATE && staleDays() >= 2 ? '<span class="rwarn">¿No está al día? Pon la tasa a mano.</span>' : '';
    const open = rateFormOpen || (RATE_LOADED && !RATE);
    el.innerHTML = `<span class="rtxt">${txt}</span>${stale}
      <span class="racts">${RATE_LOADED && RATE ? `<button type="button" class="rbtn" data-act="edit">${open ? 'Cerrar' : m ? 'Cambiar mi tasa' : 'Poner tasa a mano'}</button>` : ''}${m ? '<button type="button" class="rbtn" data-act="reset">Usar la oficial</button>' : ''}</span>
      ${open ? `<form class="rform">
        <label>Dólar (Bs por $)<input name="usd" inputmode="decimal" placeholder="${OFFICIAL ? nf2.format(OFFICIAL.usd) : 'Ej. 250,50'}" value="${m && m.usd ? nf4.format(m.usd) : ''}"></label>
        <label>Euro (Bs por €)<input name="eur" inputmode="decimal" placeholder="${OFFICIAL && OFFICIAL.eur ? nf2.format(OFFICIAL.eur) : 'Opcional'}" value="${m && m.eur ? nf4.format(m.eur) : ''}"></label>
        <button class="btn sm" type="submit">Guardar tasa</button>
      </form>` : ''}`;
    el.querySelector('[data-act="edit"]')?.addEventListener('click', () => { rateFormOpen = !rateFormOpen; renderRate(); if (rateFormOpen) el.querySelector('.rform input')?.focus(); });
    el.querySelector('[data-act="reset"]')?.addEventListener('click', () => { setManual(null); rateFormOpen = false; applyRate(); });
    el.querySelector('.rform')?.addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, usdV = num(f.usd.value), eurV = num(f.eur.value);
      if (!(usdV > 0) && !(eurV > 0)) { setManual(null); } else setManual({usd: usdV > 0 ? usdV : 0, eur: eurV > 0 ? eurV : 0, at: Date.now()});
      rateFormOpen = false; applyRate();
    });
  });
}
// Vuelve a mirar la tasa oficial cada 10 minutos y al volver a la pestaña.
setInterval(() => { if (!rateFormOpen) loadRate(); }, 10 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && RATE_LOADED && !rateFormOpen) loadRate(); });

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
