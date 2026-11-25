/* API HTTP de la tienda de licencias. Funciona igual dentro de Cloud Functions (onRequest) que en un servidor
   Node normal (pruebas locales contra los emuladores).
   Rutas:
     POST /tienda/oferta    {bizId?}        → precios, estado e historial del negocio (requiere sesión de administrador)
     POST /tienda/checkout  {bizId?, dur}   → crea el pedido con el precio del servidor y devuelve la URL de pago
     POST /tienda/pedido    {orderId}       → estado del pedido (la app lo consulta al volver del pago)
     POST /webhook/:proveedor               → eventos de la pasarela (firma obligatoria)
     GET  /sim/checkout?order=…  POST /sim/pagar   → solo con SIMULADOR=1: pasarela simulada para pruebas */
const { createLicencias, ApiError } = require('./licencias');
const { P } = require('./compartido');
const MAX_BODY = 64 * 1024;

function readRaw(req) {
  if (req.rawBody) return Promise.resolve(Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : String(req.rawBody));
  return new Promise((ok, ko) => {
    let n = 0; const parts = [];
    req.on('data', c => { n += c.length; if (n > MAX_BODY) { ko(new ApiError(413, 'Petición demasiado grande')); req.destroy(); } else parts.push(c); });
    req.on('end', () => ok(Buffer.concat(parts).toString('utf8'))); req.on('error', ko);
  });
}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function createApi({ db, auth, providers, env, now, notify }) {
  if (env.SIMULADOR === '1' && env.LIVE_PAYMENTS === 'autorizado') throw new Error('El simulador no puede convivir con cobros reales');
  const L = createLicencias({ db, providers, env, now, notify });
  const origins = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

  async function user(req) {
    const h = String(req.headers.authorization || '');
    const m = /^Bearer (.+)$/.exec(h);
    if (!m) throw new ApiError(401, 'Inicia sesión');
    try { const t = await auth.verifyIdToken(m[1]); return { uid: t.uid, email: (t.email || '').toLowerCase() }; }
    catch (e) { throw new ApiError(401, 'Sesión no válida o caducada'); }
  }
  const urls = req => {
    const base = env.API_BASE || ('http://' + req.headers.host);
    return { base, app: env.APP_URL || 'https://stocksoft.app/app/' };
  };

  async function handle(req, res) {
    const send = (code, body, type) => {
      if (res.headersSent) return;
      res.statusCode = code;
      res.setHeader('Content-Type', type || 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(type ? body : JSON.stringify(body));
    };
    const origin = req.headers.origin;
    if (origin && origins.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'); }
    if (req.method === 'OPTIONS') return send(204, '', 'text/plain');
    const url = new URL(req.url, 'http://x'), path = url.pathname.replace(/\/+$/, '');
    try {
      const raw = req.method === 'POST' ? await readRaw(req) : '';
      const wh = /^\/webhook\/([a-z]+)$/.exec(path);
      if (wh && req.method === 'POST') return send(200, await webhook(wh[1], raw, req.headers));
      const body = () => { try { return raw ? JSON.parse(raw) : {}; } catch (e) { throw new ApiError(400, 'JSON no válido'); } };
      if (path === '/tienda/oferta' && req.method === 'POST') { const u = await user(req); return send(200, await L.offer({ uid: u.uid, bizId: body().bizId })); }
      if (path === '/tienda/checkout' && req.method === 'POST') {
        const u = await user(req), b = body();
        // Solo se aceptan bizId y dur. Cualquier precio, importe o moneda que mande el navegador se ignora.
        return send(200, await L.checkout({ uid: u.uid, email: u.email, bizId: b.bizId, dur: b.dur }, urls(req)));
      }
      if (path === '/tienda/pedido' && req.method === 'POST') { const u = await user(req); return send(200, await L.orderStatus({ uid: u.uid, orderId: body().orderId })); }
      if (env.SIMULADOR === '1' && providers.simulador && path === '/sim/checkout' && req.method === 'GET') return send(200, await simPage(url.searchParams.get('order')), 'text/html; charset=utf-8');
      if (env.SIMULADOR === '1' && providers.simulador && path === '/sim/pagar' && req.method === 'POST') return send(200, await simPay(body()));
      return send(404, { error: 'No encontrado' });
    } catch (e) {
      const code = e.status || 500;
      if (code >= 500) console.error('api', e);
      return send(code, { error: code >= 500 && !e.status ? 'Error interno' : e.message, code: e.code || '' });
    }
  }

  async function webhook(pid, raw, headers) {
    const p = providers[pid];
    if (!p) throw new ApiError(404, 'Proveedor desconocido');
    const ev = p.verify(raw, headers, now ? now() : Date.now()); // lanza 400 si la firma no vale
    return { ok: true, ...(await L.applyEvent(pid, ev)) };
  }

  // ---- Pasarela simulada (solo pruebas) ----
  async function simPage(orderId) {
    const o = await db.doc('orders/' + String(orderId || '')).get();
    if (!o.exists) return '<p>Pedido no encontrado</p>';
    const d = o.data();
    return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pago simulado</title>
<style>body{font-family:system-ui,sans-serif;max-width:440px;margin:40px auto;padding:0 16px;background:#f6f7fb;color:#122}.c{background:#fff;border-radius:14px;padding:20px;box-shadow:0 2px 10px #0001}b.big{font-size:28px}button{display:block;width:100%;padding:12px;margin-top:10px;border:0;border-radius:10px;font-size:15px;cursor:pointer}.ok{background:#0a7d4f;color:#fff}.ko{background:#fde2e1;color:#8a1c14}.mut{color:#667;font-size:13px}</style>
<div class="c"><p class="mut">PASARELA SIMULADA · entorno de pruebas · no se cobra nada</p><h2>StockSoft · licencia ${esc(d.label)}</h2>
<p><b class="big">${esc(P.fmt(d.amount, d.currency))}</b>${d.promo ? ' <span class="mut">(precio normal ' + esc(P.fmt(d.normal, d.currency)) + ')</span>' : ''}</p>
<p class="mut">Pedido ${esc(o.id)} · estado: <b id="st">${esc(d.status)}</b></p>
<button class="ok" onclick="pay('paid')">Aprobar pago de prueba</button><button class="ko" onclick="pay('failed')">Rechazar pago</button><button class="ko" onclick="pay('refunded')">Reembolsar (si ya se pagó)</button>
<p id="r" class="mut"></p></div>
<script>async function pay(t){const r=await fetch('pagar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({order:${JSON.stringify(o.id)},result:t})});const j=await r.json();document.getElementById('r').textContent=j.result?('Resultado: '+j.result+'. Ya puedes volver a StockSoft.'):(j.error||'Error');}</script>`;
  }
  async function simPay({ order, result }) {
    const o = await db.doc('orders/' + String(order || '')).get();
    if (!o.exists) throw new ApiError(404, 'Pedido no encontrado');
    if (!['paid', 'failed', 'refunded'].includes(result)) throw new ApiError(400, 'Resultado no válido');
    const d = o.data();
    const ev = { id: 'simev_' + o.id + '_' + result, type: result, orderId: o.id, amount: d.amount, currency: d.currency, ref: d.providerRef || '' };
    const raw = JSON.stringify(ev);
    // Mismo camino que un webhook real: se firma y se verifica.
    return webhook('simulador', raw, { 'x-sim-signature': providers.simulador.sign(raw, Math.floor((now ? now() : Date.now()) / 1000)) });
  }

  return { handle, L };
}
module.exports = { createApi };
