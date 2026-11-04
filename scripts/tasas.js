// Consulta la tasa oficial del BCV (dólar y euro) y la guarda en web/tasas.json.
// Lo ejecuta GitHub Actions cada 30 minutos; la app la lee desde ahí.
const https = require('https');
const fs = require('fs');
const path = require('path');

function get(url, insecure, depth = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept-Language': 'es' }, rejectUnauthorized: !insecure, timeout: 25000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth < 4) { res.resume(); return get(new URL(res.headers.location, url).href, insecure, depth + 1).then(resolve, reject); }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error(url + ' → HTTP ' + res.statusCode)); }
      let d = ''; res.setEncoding('utf8'); res.on('data', c => d += c); res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout ' + url)));
  });
}
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
function textoFecha(iso) { const d = new Date(iso + 'T12:00:00Z'); return DIAS[d.getUTCDay()] + ' ' + d.getUTCDate() + ' de ' + MESES[d.getUTCMonth()] + ' de ' + d.getUTCFullYear(); }

async function desdeBCV() {
  let html;
  try { html = await get('https://www.bcv.org.ve/', false); } catch (e) { html = await get('https://www.bcv.org.ve/', true); }
  const grab = id => { const m = html.match(new RegExp('id="' + id + '"[\\s\\S]{0,1500}?<strong[^>]*>\\s*([\\d.,]+)\\s*</strong>', 'i')); return m ? parseFloat(m[1].replace(/\./g, '').replace(',', '.')) : null; };
  const iso = (html.match(/Fecha Valor:[\s\S]{0,400}?content="(\d{4}-\d{2}-\d{2})/i) || [])[1] || null;
  const usd = grab('dolar'), eur = grab('euro');
  if (!usd) throw new Error('No se encontró la tasa en bcv.org.ve');
  return { usd, eur, dateISO: iso, src: 'bcv.org.ve' };
}
async function desdeDolarApi() {
  const d = JSON.parse(await get('https://ve.dolarapi.com/v1/dolares/oficial'));
  let e = null; try { e = JSON.parse(await get('https://ve.dolarapi.com/v1/euros/oficial')); } catch (err) {}
  const usd = Number(d.promedio ?? d.venta ?? d.compra), eur = e ? Number(e.promedio ?? e.venta ?? e.compra) : null;
  if (!(usd > 0)) throw new Error('dolarapi sin dato');
  return { usd, eur: eur > 0 ? eur : null, dateISO: d.fechaActualizacion ? String(d.fechaActualizacion).slice(0, 10) : null, src: 'dolarapi' };
}

(async () => {
  const file = path.join(__dirname, '..', 'web', 'tasas.json');
  let prev = null; try { prev = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {}
  let r = null;
  for (const f of [desdeBCV, desdeDolarApi]) {
    try { r = await f(); console.log('✓', r.src, r.usd, r.eur, r.dateISO); break; } catch (e) { console.warn('✗', f.name, e.message); }
  }
  if (!r) { console.error('No se pudo obtener la tasa de ninguna fuente'); process.exit(0); }
  // Un salto grande se confirma con la otra fuente (antes se bloqueaba para siempre y la tasa se quedaba congelada).
  if (prev && prev.usd && Math.abs(r.usd - prev.usd) / prev.usd > 0.15) {
    let ok = false;
    for (const f of [desdeBCV, desdeDolarApi]) {
      if ((f === desdeBCV) === (r.src === 'bcv.org.ve')) continue;
      try { const o = await f(); ok = Math.abs(o.usd - r.usd) / r.usd < 0.02; console.log('Confirmación con', o.src, o.usd, ok ? '✓' : '✗'); } catch (e) { console.warn('Sin confirmación:', e.message); }
    }
    if (!ok) { console.error('Cambio mayor al 15 % sin confirmar, no se guarda', prev.usd, '→', r.usd); process.exit(0); }
  }
  if (prev && prev.dateISO && r.dateISO && r.dateISO < prev.dateISO) { console.log('La fuente tiene una fecha más antigua (' + r.dateISO + ') que la guardada (' + prev.dateISO + '); no se cambia'); process.exit(0); }
  if (!r.eur && prev && prev.eur) r.eur = prev.eur;
  const out = { usd: r.usd, eur: r.eur, dateISO: r.dateISO, dateText: r.dateISO ? textoFecha(r.dateISO) : '', src: r.src };
  if (prev && prev.usd === out.usd && prev.eur === out.eur && prev.dateISO === out.dateISO) { console.log('Sin cambios'); process.exit(0); }
  fs.writeFileSync(file, JSON.stringify({ ...out, updated: new Date().toISOString() }, null, 2) + '\n');
  console.log('Guardado', out);
})();
