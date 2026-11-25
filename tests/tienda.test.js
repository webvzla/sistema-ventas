// Tienda de licencias de punta a punta contra los EMULADORES (Auth + Firestore), con la API real (functions/lib/api.js)
// servida por HTTP, tokens reales del emulador de Auth, webhooks firmados y reloj controlado. Sin dinero ni cuentas reales.
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const http = require('http'), crypto = require('crypto');
const admin = require('firebase-admin');
const { createApi } = require('../functions/lib/api');
const proveedores = require('../functions/lib/proveedores');
const P = require('../web/precios.js');
const { T, end } = require('./lib/t').suite('tienda');

admin.initializeApp({ projectId: 'demo-stocksoft' });
const db = admin.firestore(), auth = admin.auth();
const D = 864e5;
let clock = Date.UTC(2026, 11, 1, 12);
const now = () => clock;
const SECRETS = { SIM_SECRET: 'sim-secret-de-pruebas-123456', STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_WEBHOOK_SECRET: 'whsec_test_123', PADDLE_WEBHOOK_SECRET: 'pdl_ntfset_test_123' };
const stripeCalls = [];
const fakeFetch = async (url, opt) => { stripeCalls.push({ url, opt }); return { ok: true, json: async () => ({ id: 'cs_test_' + stripeCalls.length, url: 'https://checkout.stripe.com/c/pay/cs_test_' + stripeCalls.length }) }; };
const mails = [];
function server(provider) {
  const env = { ...SECRETS, SIMULADOR: '1', PAYMENT_PROVIDER: provider, APP_URL: 'http://localhost:5173/', API_BASE: 'http://api.test' };
  const api = createApi({ db, auth, providers: proveedores.load(env, { fetch: fakeFetch }), env, now, notify: async m => mails.push(m) });
  return new Promise(ok => { const s = http.createServer(api.handle).listen(0, '127.0.0.1', () => ok({ s, url: 'http://127.0.0.1:' + s.address().port, api, env })); });
}
async function call(base, path, body, token, headers) {
  const r = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(headers || {}) }, body: typeof body === 'string' ? body : JSON.stringify(body || {}) });
  let j = null; try { j = await r.json(); } catch (e) {}
  return { ...(j || {}), body: j || {}, status: r.status };
}
async function clearAll() {
  await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST + '/emulator/v1/projects/demo-stocksoft/databases/(default)/documents', { method: 'DELETE' });
  await fetch('http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST + '/emulator/v1/projects/demo-stocksoft/accounts', { method: 'DELETE' });
}
async function user(uid, biz, role) {
  await auth.createUser({ uid, email: uid + '@prueba.test', password: 'clave-de-prueba-1' });
  await db.doc('users/' + uid).set({ biz, role, name: uid, email: uid + '@prueba.test' });
  await db.doc('biz/' + biz + '/members/' + uid).set({ role, name: uid });
  const r = await fetch('http://' + process.env.FIREBASE_AUTH_EMULATOR_HOST + '/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: uid + '@prueba.test', password: 'clave-de-prueba-1', returnSecureToken: true }) });
  return (await r.json()).idToken;
}
const biz = async id => (await db.doc('biz/' + id).get()).data();
const order = async id => (await db.doc('orders/' + id).get()).data();
const hist = async id => (await db.collection('biz/' + id + '/licHistory').get()).docs.map(d => d.data());
const signSim = (body, t) => { t = t || Math.floor(clock / 1000); return 't=' + t + ',v1=' + crypto.createHmac('sha256', SECRETS.SIM_SECRET).update(t + '.' + body).digest('hex'); };
const signStripe = (body, t) => { t = t || Math.floor(clock / 1000); return 't=' + t + ',v1=' + crypto.createHmac('sha256', SECRETS.STRIPE_WEBHOOK_SECRET).update(t + '.' + body).digest('hex'); };
const signPaddle = (body, t) => { t = t || Math.floor(clock / 1000); return 'ts=' + t + ';h1=' + crypto.createHmac('sha256', SECRETS.PADDLE_WEBHOOK_SECRET).update(t + ':' + body).digest('hex'); };
const simEvent = (base, ev) => { const raw = JSON.stringify(ev); return call(base, '/webhook/simulador', raw, null, { 'x-sim-signature': signSim(raw) }); };
const day = ms => { const d = new Date(ms); return isNaN(d) ? String(ms) : d.toISOString().slice(0, 10); };

(async () => {
  await clearAll();
  const SIM = await server('simulador'), STR = await server('stripe');
  const trialStart = admin.firestore.Timestamp.fromMillis(clock - 2 * D); // prueba gratis empezada hace 2 días → termina en 5
  await db.doc('biz/bizNuevo').set({ name: 'Bodega Nueva', owner: 'bizNuevo', trial: true, trialStart });
  await db.doc('biz/bizNuevo/config/main').set({ name: 'Bodega Nueva', country: 'VE' });
  await db.doc('biz/bizViejo').set({ name: 'Abasto Viejo', owner: 'bizViejo', trial: false, license: 'CODIGO1', expires: clock + 10 * D });
  await db.doc('biz/bizViejo/config/main').set({ name: 'Abasto Viejo' }); // sin país: Venezuela heredada
  await db.doc('biz/bizES').set({ name: 'Tienda Madrid', owner: 'bizES', trial: true, trialStart });
  await db.doc('biz/bizES/config/main').set({ name: 'Tienda Madrid', country: 'ES' });
  await db.doc('biz/bizVencido').set({ name: 'Kiosco', owner: 'bizVencido', trial: false, license: 'CODIGO2', expires: clock - 30 * D });
  await db.doc('biz/bizVencido/config/main').set({ name: 'Kiosco', country: 'VE' });
  await db.doc('biz/bizVida').set({ name: 'Eterno', owner: 'bizVida', trial: false, license: 'CODIGO3', expires: 0 });
  await db.doc('biz/bizBloq').set({ name: 'Bloqueado', owner: 'bizBloq', trial: false, license: 'C4', expires: clock + D, blocked: true });
  await db.doc('biz/bizCortesia').set({ name: 'Cortesía', owner: 'bizCortesia', trial: false, expires: clock + 20 * D, courtesy: true });
  const tk = {
    nuevo: await user('bizNuevo', 'bizNuevo', 'admin'), vend: await user('vendNuevo', 'bizNuevo', 'vendedor'),
    viejo: await user('bizViejo', 'bizViejo', 'admin'), es: await user('bizES', 'bizES', 'admin'), venc: await user('bizVencido', 'bizVencido', 'admin'),
    vida: await user('bizVida', 'bizVida', 'admin'), bloq: await user('bizBloq', 'bizBloq', 'admin'), cort: await user('bizCortesia', 'bizCortesia', 'admin')
  };
  await db.doc('store/config').set({ promoStart: clock - 5 * D, promoDays: 60 });

  // ---- Autenticación y permisos ----
  T('A1', 'Sin sesión: 401', (await call(SIM.url, '/tienda/oferta', {})).status === 401);
  T('A2', 'Token falso: 401', (await call(SIM.url, '/tienda/oferta', {}, 'token-falso')).status === 401);
  T('A3', 'Vendedor no puede ver la tienda ni comprar (403)', (await call(SIM.url, '/tienda/checkout', { dur: 'm1' }, tk.vend)).status === 403);
  T('A4', 'Administrador de un negocio no puede comprar para otro negocio (403)', (await call(SIM.url, '/tienda/checkout', { bizId: 'bizNuevo', dur: 'm1' }, tk.es)).status === 403);
  T('A5', 'Negocio bloqueado no puede comprar (403)', (await call(SIM.url, '/tienda/checkout', { dur: 'm1' }, tk.bloq)).status === 403);
  T('A6', 'Licencia sin vencimiento: no se le cobra (409)', (await call(SIM.url, '/tienda/checkout', { dur: 'm1' }, tk.vida)).status === 409);

  // ---- Oferta ----
  { const o = await call(SIM.url, '/tienda/oferta', {}, tk.nuevo);
    T('O1', 'Oferta de cliente nuevo en promoción: 4 duraciones con normal y promo (−20 %), estado y vencimiento de la prueba', o.status === 200 && o.offers.length === 4 && o.offers.every(x => x.promo) && o.offers.map(x => x.final).join() === '479,1359,2399,3999' && o.offers[0].normal === 599 && o.biz.status === 'prueba' && day(o.biz.expires) === day(clock + 5 * D) && o.available, o); }
  { const o = await call(SIM.url, '/tienda/oferta', {}, tk.viejo);
    T('O2', 'Cliente que ya tenía licencia (renovación): precio normal aunque haya promoción', o.offers.every(x => !x.promo) && o.offers.map(x => x.final).join() === '599,1699,2999,4999', o.offers); }
  { const o = await call(SIM.url, '/tienda/oferta', {}, tk.es);
    T('O3', 'Negocio de España: sin precio aprobado → no se puede comprar y se explica', o.offers.length === 0 && !o.available && /España/.test(o.reason), o); }
  { const o = await call(SIM.url, '/tienda/oferta', {}, tk.cort);
    T('O4', 'Negocio con cortesía (sin pagos): sigue siendo cliente nuevo para la promoción', o.offers.every(x => x.promo), o.offers); }

  // ---- Compra de 1 mes con promoción (cliente nuevo en prueba) ----
  let o1;
  { const r = await call(SIM.url, '/tienda/checkout', { dur: 'm1', amount: 1, currency: 'XXX', promo: true, price: 0.01, bizId: 'bizNuevo' }, tk.nuevo);
    o1 = r.orderId; const od = await order(o1);
    T('C1', 'Checkout manipulado (importe 0,01, moneda falsa): se ignora y el pedido lleva el precio del servidor 4,79 USD', r.status === 200 && od.amount === 479 && od.currency === 'USD' && od.promo && od.biz === 'bizNuevo' && od.status === 'pending' && /\/sim\/checkout\?order=/.test(r.url), { r, od }); }
  T('C2', 'Llegar a la página de "pago correcto" no activa nada (la licencia sigue en prueba)', (await biz('bizNuevo')).trial === true && (await order(o1)).status === 'pending');
  T('C3', 'Duración inexistente rechazada (400)', (await call(SIM.url, '/tienda/checkout', { dur: 'm24' }, tk.nuevo)).status === 400);
  { const b0 = await biz('bizNuevo'); const raw = JSON.stringify({ id: 'ev1', type: 'paid', orderId: o1, amount: 479, currency: 'USD' });
    const bad = await call(SIM.url, '/webhook/simulador', raw, null, { 'x-sim-signature': 't=' + Math.floor(clock / 1000) + ',v1=' + 'a'.repeat(64) });
    const none = await call(SIM.url, '/webhook/simulador', raw);
    const old = await call(SIM.url, '/webhook/simulador', raw, null, { 'x-sim-signature': signSim(raw, Math.floor(clock / 1000) - 3600) });
    T('W1', 'Webhook con firma falsa, sin firma o caducada (repetición antigua): 400 y nada cambia', bad.status === 400 && none.status === 400 && old.status === 400 && (await biz('bizNuevo')).trial === true && JSON.stringify(await biz('bizNuevo')) === JSON.stringify(b0), { bad, none, old }); }
  { const r = await simEvent(SIM.url, { id: 'ev-tamper', type: 'paid', orderId: o1, amount: 1, currency: 'USD', ref: 'sim_' + o1 });
    T('W2', 'Webhook firmado pero con importe distinto al del pedido: no activa, pedido "en revisión"', r.result === 'no_coincide' && (await order(o1)).status === 'revisar' && (await biz('bizNuevo')).trial === true, r); }
  // nuevo pedido de 1 mes y pago correcto
  { const r = await call(SIM.url, '/tienda/checkout', { dur: 'm1' }, tk.nuevo); o1 = r.orderId; }
  { const pay = await call(SIM.url, '/sim/pagar', { order: o1, result: 'paid' }); const b = await biz('bizNuevo'), od = await order(o1);
    const expect = P.addMonths(clock + 5 * D, 1);
    T('K1', 'Pago aprobado (1 mes, promo): licencia activada al final de la prueba + 1 mes, pedido pagado, historial y aviso', pay.result === 'activada' && b.trial === false && b.expires === expect && b.paidOnce && od.status === 'paid' && (await hist('bizNuevo')).some(h => h.type === 'compra' && h.amount === 479 && h.months === 1) && mails.some(m => m.kind === 'compra'), { pay, exp: day(b.expires), want: day(expect) }); }
  { const b0 = await biz('bizNuevo'); const r = await call(SIM.url, '/sim/pagar', { order: o1, result: 'paid' });
    T('K2', 'Webhook duplicado (mismo evento): "duplicado" y la licencia no se amplía dos veces', r.result === 'duplicado' && (await biz('bizNuevo')).expires === b0.expires, r); }
  { const b0 = await biz('bizNuevo'); const r = await simEvent(SIM.url, { id: 'otro-evento-mismo-pago', type: 'paid', orderId: o1, amount: 479, currency: 'USD', ref: 'sim_' + o1 });
    T('K3', 'Otro evento distinto del mismo pago: "ya aplicado", sin segunda activación', r.result === 'ya_aplicado' && (await biz('bizNuevo')).expires === b0.expires, r); }
  { const st = await call(SIM.url, '/tienda/pedido', { orderId: o1 }, tk.nuevo), other = await call(SIM.url, '/tienda/pedido', { orderId: o1 }, tk.viejo);
    T('K4', 'Estado del pedido: el comprador lo ve "paid" con la nueva fecha; otra cuenta recibe 403', st.status === 200 && st.body.status === 'paid' && st.to > 0 && other.status === 403, { st, other }); }

  // ---- Renovación (ya no es nuevo): 3 meses a precio normal, se suma al vencimiento ----
  { const b0 = await biz('bizNuevo'); const r = await call(SIM.url, '/tienda/checkout', { dur: 'm3' }, tk.nuevo); const od = await order(r.orderId);
    await call(SIM.url, '/sim/pagar', { order: r.orderId, result: 'paid' }); const b = await biz('bizNuevo');
    T('K5', 'Compra de 3 meses tras pagar una vez: precio normal 16,99 (sin promo en renovación) y +3 meses sobre el vencimiento actual', od.amount === 1699 && !od.promo && b.expires === P.addMonths(b0.expires, 3), { amount: od.amount, exp: day(b.expires) }); }
  // ---- 6 y 12 meses sobre licencia existente (código) ----
  { const b0 = await biz('bizViejo'); const r6 = await call(SIM.url, '/tienda/checkout', { dur: 'm6' }, tk.viejo); await call(SIM.url, '/sim/pagar', { order: r6.orderId, result: 'paid' });
    const b6 = await biz('bizViejo'); const r12 = await call(SIM.url, '/tienda/checkout', { dur: 'm12' }, tk.viejo); await call(SIM.url, '/sim/pagar', { order: r12.orderId, result: 'paid' }); const b12 = await biz('bizViejo');
    T('K6', 'Compra de 6 meses (29,99) amplía la licencia activa desde su vencimiento', (await order(r6.orderId)).amount === 2999 && b6.expires === P.addMonths(b0.expires, 6) && b6.license === 'CODIGO1', { exp: day(b6.expires) });
    T('K7', 'Compra de 12 meses (49,99) se acumula sobre la anterior', (await order(r12.orderId)).amount === 4999 && b12.expires === P.addMonths(b6.expires, 12), { exp: day(b12.expires) }); }
  // ---- Licencia vencida: la compra empieza hoy ----
  { const r = await call(SIM.url, '/tienda/checkout', { dur: 'm1' }, tk.venc); await call(SIM.url, '/sim/pagar', { order: r.orderId, result: 'paid' }); const b = await biz('bizVencido');
    T('K8', 'Licencia vencida hace 30 días: 1 mes contado desde hoy (no desde el vencimiento viejo), precio normal', b.expires === P.addMonths(clock, 1) && (await order(r.orderId)).amount === 599, day(b.expires)); }
  // ---- Pago rechazado ----
  { const b0 = await biz('bizViejo'); const r = await call(SIM.url, '/tienda/checkout', { dur: 'm1' }, tk.viejo); const x = await call(SIM.url, '/sim/pagar', { order: r.orderId, result: 'failed' });
    T('K9', 'Pago rechazado: pedido "failed", licencia intacta, historial "pago rechazado" y aviso', x.result === 'fallido' && (await order(r.orderId)).status === 'failed' && (await biz('bizViejo')).expires === b0.expires && (await hist('bizViejo')).some(h => h.type === 'pago_fallido') && mails.some(m => m.kind === 'fallido'), x);
    const late = await call(SIM.url, '/sim/pagar', { order: r.orderId, result: 'paid' });
    T('K10', 'Un "pagado" que llega después de un rechazo sí activa (la pasarela reintentó y cobró)', late.result === 'activada', late); }
  // ---- Reembolso ----
  { const b0 = await biz('bizVencido'); const lastOrder = b0.lastOrder; const r = await call(SIM.url, '/sim/pagar', { order: lastOrder, result: 'refunded' }); const b = await biz('bizVencido');
    T('K11', 'Reembolso total: se descuenta el periodo comprado (licencia vuelve a vencer hoy), pedido "refunded", historial y aviso', r.result === 'reembolsada' && b.expires === clock && (await order(lastOrder)).status === 'refunded' && (await hist('bizVencido')).some(h => h.type === 'reembolso' && h.months === -1), { r, exp: day(b.expires) });
    const r2 = await simEvent(SIM.url, { id: 'reemb-2', type: 'refunded', orderId: lastOrder });
    T('K12', 'Reembolso repetido (otro evento): no descuenta dos veces', r2.result === 'reembolso_sin_pago' && (await biz('bizVencido')).expires === clock, r2); }
  // ---- Aislamiento entre negocios ----
  { const bA0 = await biz('bizViejo'), bB0 = await biz('bizNuevo');
    const r = await call(SIM.url, '/tienda/checkout', { dur: 'm1' }, tk.viejo);
    const x = await simEvent(SIM.url, { id: 'cruzado', type: 'paid', orderId: r.orderId, amount: 599, currency: 'USD', ref: 'sim_' + r.orderId, biz: 'bizNuevo', bizId: 'bizNuevo' });
    T('K13', 'Un pago del negocio A (aunque el evento diga "bizNuevo") solo amplía el negocio A', x.result === 'activada' && (await biz('bizViejo')).expires === P.addMonths(bA0.expires, 1) && (await biz('bizNuevo')).expires === bB0.expires, x); }
  { const r = await simEvent(SIM.url, { id: 'sin-pedido', type: 'paid', orderId: 'no-existe', amount: 599, currency: 'USD' });
    T('K14', 'Webhook de un pedido inexistente: ignorado sin activar nada', r.result === 'pedido_inexistente', r); }

  // ---- Fin de la promoción ----
  { await db.doc('biz/bizNuevo2').set({ name: 'Otra Nueva', owner: 'bizNuevo2', trial: true, trialStart: admin.firestore.Timestamp.fromMillis(clock) });
    await db.doc('biz/bizNuevo2/config/main').set({ country: 'VE' }); const t2 = await user('bizNuevo2', 'bizNuevo2', 'admin');
    clock += 56 * D; // día 61 desde el inicio de la promoción
    const o = await call(SIM.url, '/tienda/oferta', {}, t2), r = await call(SIM.url, '/tienda/checkout', { dur: 'm12' }, t2);
    T('K15', 'Terminada la promoción (día 61): cliente nuevo paga el precio normal (49,99)', o.offers.every(x => !x.promo) && (await order(r.orderId)).amount === 4999, o.offers.map(x => x.final));
    clock -= 56 * D; }
  // ---- Freno de abusos ----
  { let last; for (let i = 0; i < 6; i++) last = await call(SIM.url, '/tienda/checkout', { dur: 'm1' }, tk.cort);
    T('K16', 'Más de 5 pedidos abiertos en una hora: 429', last.status === 429, last); }

  // ---- Stripe (modo prueba, adaptador real con eventos firmados localmente) ----
  { const r = await call(STR.url, '/tienda/checkout', { dur: 'm6' }, tk.viejo); const od = await order(r.orderId); const c = stripeCalls[stripeCalls.length - 1];
    const body = new URLSearchParams(c.opt.body);
    T('S1', 'Stripe: la sesión se crea con el importe del servidor (2999), moneda usd, metadatos del pedido e Idempotency-Key', r.status === 200 && od.provider === 'stripe' && body.get('line_items[0][price_data][unit_amount]') === '2999' && body.get('line_items[0][price_data][currency]') === 'usd' && body.get('metadata[orderId]') === r.orderId && c.opt.headers['Idempotency-Key'] === 'order-' + r.orderId && /^https:\/\/checkout\.stripe\.com/.test(r.url), { r, b: c.opt.body });
    const evPaid = (id, status) => JSON.stringify({ id, type: 'checkout.session.completed', data: { object: { id: od.providerRef || ('cs_test_' + stripeCalls.length), payment_status: status, amount_total: 2999, currency: 'usd', metadata: { orderId: r.orderId, biz: 'bizViejo' }, client_reference_id: r.orderId } } });
    const unpaid = evPaid('evt_1', 'unpaid'); const u = await call(STR.url, '/webhook/stripe', unpaid, null, { 'stripe-signature': signStripe(unpaid) });
    T('S2', 'Stripe: sesión completada pero sin cobrar (pago asíncrono pendiente) no activa', u.result === 'ignorado' && (await order(r.orderId)).status === 'pending', u);
    const b0 = await biz('bizViejo'); const paid = evPaid('evt_2', 'paid'); const p = await call(STR.url, '/webhook/stripe', paid, null, { 'stripe-signature': signStripe(paid) });
    T('S3', 'Stripe: checkout.session.completed pagado y bien firmado activa +6 meses', p.result === 'activada' && (await biz('bizViejo')).expires === P.addMonths(b0.expires, 6), p);
    const bad = await call(STR.url, '/webhook/stripe', paid, null, { 'stripe-signature': signStripe(paid).replace(/.$/, '0') });
    T('S4', 'Stripe: firma alterada → 400', bad.status === 400, bad);
    const viaSim = await simEvent(SIM.url, { id: 'cruce-prov', type: 'paid', orderId: r.orderId, amount: 2999, currency: 'USD' });
    T('S5', 'Un evento del simulador no puede pagar un pedido de Stripe', viaSim.result === 'proveedor_distinto', viaSim);
    const ref = JSON.stringify({ id: 'evt_3', type: 'charge.refunded', data: { object: { id: 'ch_1', amount: 2999, amount_refunded: 1000, currency: 'usd', metadata: { orderId: r.orderId } } } });
    const pr = await call(STR.url, '/webhook/stripe', ref, null, { 'stripe-signature': signStripe(ref) });
    T('S6', 'Stripe: reembolso parcial no quita la licencia; queda marcado para revisión', pr.result === 'reembolso_parcial' && (await order(r.orderId)).status === 'paid' && /parcial/.test((await order(r.orderId)).review), pr);
    const exp = JSON.stringify({ id: 'evt_4', type: 'checkout.session.expired', data: { object: { id: 'cs_x', metadata: { orderId: (await call(STR.url, '/tienda/checkout', { dur: 'm1' }, tk.viejo)).orderId } } } });
    const ex = await call(STR.url, '/webhook/stripe', exp, null, { 'stripe-signature': signStripe(exp) });
    T('S7', 'Stripe: sesión caducada → pedido cancelado', ex.result === 'cancelado', ex); }
  { let threw = ''; try { require('../functions/lib/proveedores/stripe').create({ STRIPE_SECRET_KEY: 'sk_live_123' }); } catch (e) { threw = e.message; }
    T('S8', 'Stripe: una clave real (sk_live_) se bloquea sin autorización de lanzamiento', /bloqueada/.test(threw), threw);
    let t2 = ''; try { createApi({ db, auth, providers: {}, env: { SIMULADOR: '1', LIVE_PAYMENTS: 'autorizado' } }); } catch (e) { t2 = e.message; }
    T('S9', 'El simulador no puede activarse junto con cobros reales', /simulador/i.test(t2), t2); }

  // ---- Paddle (adaptador preparado: verificación de firma y lectura de eventos) ----
  { const pd = require('../functions/lib/proveedores/paddle').create(SECRETS);
    const raw = JSON.stringify({ event_id: 'evt_p1', event_type: 'transaction.completed', data: { id: 'txn_1', currency_code: 'USD', custom_data: { orderId: 'o9' }, details: { totals: { grand_total: '599' } } } });
    const ev = pd.verify(raw, { 'paddle-signature': signPaddle(raw) }, clock); let bad = '';
    try { pd.verify(raw, { 'paddle-signature': signPaddle(raw).replace(/.$/, '0') }, clock); } catch (e) { bad = e.message; }
    T('P1', 'Paddle: firma válida → pago normalizado (599 USD, pedido o9); firma alterada → rechazo', ev.type === 'paid' && ev.amount === 599 && ev.currency === 'USD' && ev.orderId === 'o9' && /no válida/.test(bad), { ev, bad });
    let cs = 0; try { await pd.createSession({}); } catch (e) { cs = e.status; }
    T('P2', 'Paddle: el checkout queda deshabilitado (503) hasta tener cuenta aprobada', cs === 503);
    const pp = require('../functions/lib/proveedores/paypal').create(); let pv = ''; try { pp.verify('{}', {}); } catch (e) { pv = e.message; }
    T('P3', 'PayPal: pendiente, rechaza cualquier webhook', /no está habilitado/.test(pv)); }

  // ---- Pasarela simulada: página ----
  { const r = await call(SIM.url, '/tienda/checkout', { dur: 'm3' }, tk.viejo); const html = await (await fetch(SIM.url + '/sim/checkout?order=' + r.orderId)).text();
    T('U1', 'Página del simulador: muestra importe del servidor y avisa de que no se cobra', /\$16,99/.test(html) && /no se cobra/.test(html), html.slice(0, 200)); }

  SIM.s.close(); STR.s.close();
  process.exit(end() ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
