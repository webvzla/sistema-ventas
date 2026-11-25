/* StockSoft · Núcleo del sistema de licencias (servidor). Independiente de la pasarela de pago.
   Reglas de oro:
   - El precio lo calcula SIEMPRE el servidor (precios.js). Lo que mande el navegador se ignora.
   - Una licencia solo se activa por un webhook verificado, nunca por llegar a la página de "pago correcto".
   - Cada evento se procesa una sola vez (payments/{proveedor}_{evento}, dentro de una transacción) y cada pedido
     solo puede activar una vez (estado del pedido), así que ni un webhook repetido ni dos eventos distintos del
     mismo pago amplían dos veces.
   - El pedido guarda a qué negocio pertenece; el webhook no puede cambiarlo, así que un pago no puede activar otro negocio.
   Colecciones: orders/{id}, payments/{proveedor_evento}, biz/{b}/licHistory/{id}, store/config. */
const { P, R } = require('./compartido');

const TRIAL_MS = 7 * P.DAY;
const ms = v => (v && typeof v.toMillis === 'function') ? v.toMillis() : Number(v) || 0;
// Fin del acceso actual (0 = sin vencimiento), igual que bizExp() en la app.
const bizExp = b => b.trial ? (ms(b.trialStart) || Date.now()) + TRIAL_MS : Number(b.expires) || 0;
// Cliente nuevo para la promoción: nunca pagó en la tienda ni canjeó un código, y está en prueba o con cortesía.
const isNewCustomer = b => !b.paidOnce && !b.license && (b.trial === true || b.courtesy === true);

class ApiError extends Error { constructor(status, msg, code) { super(msg); this.status = status; this.code = code || ''; } }

function createLicencias({ db, providers, env, now: nowFn, notify }) {
  const now = nowFn || (() => Date.now());
  const say = notify || (async () => {});
  const providerId = () => env.PAYMENT_PROVIDER || (env.SIMULADOR === '1' ? 'simulador' : 'stripe');

  async function store() { const s = await db.doc('store/config').get(); return s.exists ? s.data() : {}; }

  // Solo un administrador del propio negocio puede ver ofertas o comprar. Se comprueba con datos del servidor.
  async function requireAdmin(uid, bizId) {
    if (!uid) throw new ApiError(401, 'Inicia sesión');
    const u = await db.doc('users/' + uid).get();
    const prof = u.exists ? u.data() : null;
    const b = bizId || (prof && prof.biz);
    if (!prof || !b || prof.biz !== b) throw new ApiError(403, 'Esta cuenta no pertenece a ese negocio');
    const m = await db.doc('biz/' + b + '/members/' + uid).get();
    if (prof.role !== 'admin' || !m.exists || m.data().role !== 'admin') throw new ApiError(403, 'Solo el administrador del negocio puede comprar la licencia');
    const bd = await db.doc('biz/' + b).get();
    if (!bd.exists) throw new ApiError(404, 'El negocio no existe');
    const cd = await db.doc('biz/' + b + '/config/main').get();
    return { bizId: b, biz: bd.data(), cfg: cd.exists ? cd.data() : {} };
  }
  const regionOf = cfg => R.fromConfig(cfg).code;
  const status = b => b.blocked ? 'bloqueado' : (bizExp(b) && bizExp(b) < now()) ? (b.trial ? 'prueba_terminada' : 'vencida') : b.trial ? 'prueba' : 'activa';

  async function history(bizId, limit) {
    const s = await db.collection('biz/' + bizId + '/licHistory').orderBy('at', 'desc').limit(limit || 30).get();
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async function offer({ uid, bizId }) {
    const c = await requireAdmin(uid, bizId), st = await store(), region = regionOf(c.cfg);
    const ctx = { now: now(), store: st, isNew: isNewCustomer(c.biz) };
    const list = P.offers(region, ctx);
    const p = providers[providerId()];
    return {
      biz: { id: c.bizId, name: c.biz.name || '', expires: bizExp(c.biz), trial: !!c.biz.trial, status: status(c.biz) },
      region, plan: P.PLAN, offers: list, available: list.length > 0 && !!p && !p.error,
      reason: !list.length ? 'Todavía no hay precio aprobado para ' + R.get(region).name + '.' : (!p || p.error) ? 'El pago en línea no está disponible ahora mismo.' : '',
      provider: p ? p.id : null, test: !!p && !p.live, history: await history(c.bizId, 30)
    };
  }

  async function checkout({ uid, email, bizId, dur }, urls) {
    const c = await requireAdmin(uid, bizId);
    if (c.biz.blocked) throw new ApiError(403, 'El acceso de este negocio está suspendido. Contacta con soporte.');
    if (!Number(c.biz.expires) && !c.biz.trial && c.biz.license) throw new ApiError(409, 'Tu licencia no tiene vencimiento: no necesitas comprar.');
    const region = regionOf(c.cfg), st = await store();
    const q = P.quote(region, String(dur || ''), { now: now(), store: st, isNew: isNewCustomer(c.biz) });
    if (!q) throw new ApiError(400, 'Esa duración no está disponible para tu país');
    const pid = providerId(), p = providers[pid];
    if (!p || p.error) throw new ApiError(503, 'El pago en línea no está disponible ahora mismo');
    // Freno contra abusos: como mucho 5 pedidos abiertos por negocio en la última hora.
    const open = await db.collection('orders').where('biz', '==', c.bizId).get();
    if (open.docs.filter(d => d.data().status === 'pending' && d.data().createdAt > now() - 3600e3).length >= 5) throw new ApiError(429, 'Demasiados intentos de pago seguidos. Espera unos minutos.');
    const ref = db.collection('orders').doc();
    const order = { id: ref.id, biz: c.bizId, uid, email: email || '', region, dur: q.dur, months: q.months, label: q.label, amount: q.final, normal: q.normal, currency: q.currency, promo: q.promo, provider: pid, test: !p.live, status: 'pending', createdAt: now() };
    await ref.set(order);
    let s;
    try { s = await p.createSession(order, { base: urls.base, success: urls.app + '?pago=ok&pedido=' + ref.id, cancel: urls.app + '?pago=cancelado&pedido=' + ref.id }); }
    catch (e) { await ref.update({ status: 'error', error: String(e.message).slice(0, 300) }); throw new ApiError(e.status || 502, e.message); }
    await ref.update({ providerRef: s.ref });
    return { orderId: ref.id, url: s.url, amount: q.final, currency: q.currency, promo: q.promo, test: !p.live };
  }

  async function orderStatus({ uid, orderId }) {
    const o = await db.doc('orders/' + String(orderId || '')).get();
    if (!o.exists) throw new ApiError(404, 'Pedido no encontrado');
    const d = o.data();
    if (d.uid !== uid) throw new ApiError(403, 'Ese pedido no es tuyo');
    return { id: o.id, status: d.status, label: d.label, amount: d.amount, currency: d.currency, from: d.from || 0, to: d.to || 0 };
  }

  /* Aplica un evento ya verificado por el adaptador. Devuelve {result, ...}. Todo en una transacción. */
  async function applyEvent(pid, ev) {
    if (!ev || !ev.id) throw new ApiError(400, 'Evento sin identificador');
    const t = now();
    const mref = db.doc('payments/' + pid + '_' + String(ev.id).replace(/[\/]/g, '_'));
    let out = null, mail = null;
    await db.runTransaction(async tx => {
      const m = await tx.get(mref);
      if (m.exists) { out = { result: 'duplicado' }; return; }
      const mark = r => tx.set(mref, { provider: pid, event: ev.id, type: ev.type, orderId: ev.orderId || '', result: r, at: t });
      if (ev.type === 'ignore') { mark('ignorado'); out = { result: 'ignorado' }; return; }
      if (!ev.orderId) { mark('sin_pedido'); out = { result: 'sin_pedido' }; return; }
      const oref = db.doc('orders/' + ev.orderId), od = await tx.get(oref);
      if (!od.exists) { mark('pedido_inexistente'); out = { result: 'pedido_inexistente' }; return; }
      const o = od.data();
      if (o.provider !== pid) { mark('proveedor_distinto'); out = { result: 'proveedor_distinto' }; return; }
      const bref = db.doc('biz/' + o.biz), bd = await tx.get(bref);
      const b = bd.exists ? bd.data() : null;
      const hist = (id, data) => tx.set(db.doc('biz/' + o.biz + '/licHistory/' + id), { orderId: o.id, provider: pid, at: t, ...data });

      if (ev.type === 'paid') {
        if (o.status === 'paid' || o.status === 'refunded') { mark('ya_aplicado'); out = { result: 'ya_aplicado' }; return; }
        // El importe y la moneda tienen que ser exactamente los del pedido que calculó el servidor.
        if (ev.amount !== o.amount || ev.currency !== o.currency || (o.providerRef && ev.ref && ev.ref !== o.providerRef) || !b) {
          tx.update(oref, { status: 'revisar', review: 'Importe, moneda o referencia no coinciden', paidEvent: ev.id, paidAmount: ev.amount || 0, paidCurrency: ev.currency || '' });
          mark('no_coincide'); out = { result: 'no_coincide' }; return;
        }
        const cur = bizExp(b), lifetime = !b.trial && !Number(b.expires) && !!b.license;
        const from = lifetime ? 0 : Math.max(t, cur || 0), to = lifetime ? 0 : P.addMonths(from, o.months);
        tx.update(bref, lifetime ? { paidOnce: true, lastOrder: o.id } : { trial: false, expires: to, paidOnce: true, licSrc: 'tienda', lastOrder: o.id });
        tx.update(oref, { status: 'paid', paidAt: t, from, to, paidEvent: ev.id });
        hist(o.id + '_compra', { type: 'compra', months: o.months, label: o.label, from, to, amount: o.amount, currency: o.currency, promo: !!o.promo, test: !!o.test });
        mark('activada'); out = { result: 'activada', biz: o.biz, from, to };
        mail = { kind: 'compra', order: o, to, email: o.email };
        return;
      }
      if (ev.type === 'refunded') {
        if (o.status !== 'paid') { mark('reembolso_sin_pago'); out = { result: 'reembolso_sin_pago' }; return; }
        let to = b ? Number(b.expires) || 0 : 0;
        if (b && to) { to = Math.max(t, P.addMonths(to, -o.months)); tx.update(bref, { expires: to }); }
        tx.update(oref, { status: 'refunded', refundedAt: t, refundEvent: ev.id });
        hist(o.id + '_reembolso', { type: 'reembolso', months: -o.months, label: o.label, to, amount: -o.amount, currency: o.currency });
        mark('reembolsada'); out = { result: 'reembolsada', to };
        mail = { kind: 'reembolso', order: o, to, email: o.email };
        return;
      }
      if (ev.type === 'partial_refund') {
        tx.update(oref, { review: 'Reembolso parcial: revisar a mano', partialRefund: ev.amount || 0 });
        mark('reembolso_parcial'); out = { result: 'reembolso_parcial' }; return;
      }
      if (ev.type === 'failed' || ev.type === 'canceled') {
        if (o.status !== 'pending') { mark('ignorado'); out = { result: 'ignorado' }; return; }
        tx.update(oref, { status: ev.type === 'failed' ? 'failed' : 'canceled', closedAt: t });
        if (ev.type === 'failed') hist(o.id + '_fallido', { type: 'pago_fallido', label: o.label, amount: o.amount, currency: o.currency });
        mark(ev.type === 'failed' ? 'fallido' : 'cancelado'); out = { result: ev.type === 'failed' ? 'fallido' : 'cancelado' };
        if (ev.type === 'failed') mail = { kind: 'fallido', order: o, email: o.email };
        return;
      }
      mark('tipo_desconocido'); out = { result: 'tipo_desconocido' };
    });
    if (mail) { try { await say(mail); } catch (e) { console.warn('aviso', e.message); } }
    return out;
  }

  return { offer, checkout, orderStatus, applyEvent, history, requireAdmin, store, providerId };
}
module.exports = { createLicencias, ApiError, bizExp, isNewCustomer };
