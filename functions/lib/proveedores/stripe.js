/* Adaptador de Stripe (Checkout Sessions + webhooks firmados).
   SOLO MODO PRUEBA: rechaza claves sk_live_ salvo que LIVE_PAYMENTS === 'autorizado' (que no se configura sin la
   autorización expresa de Francisco). Sin cuenta de Stripe no se puede crear una sesión real; la verificación de
   firmas y la lectura de eventos sí funcionan y están probadas con eventos firmados localmente. */
const { hmac, safeEq, parseHeader, SigError } = require('./firma');
const TOLERANCE = 300;

function create(env, deps) {
  deps = deps || {};
  const key = env.STRIPE_SECRET_KEY || '', whsec = env.STRIPE_WEBHOOK_SECRET || '';
  if (/^sk_live_/.test(key) && env.LIVE_PAYMENTS !== 'autorizado') throw new Error('Stripe: clave real bloqueada (solo se admiten claves de prueba sk_test_)');
  const doFetch = deps.fetch || (typeof fetch === 'function' ? fetch : null);
  return {
    id: 'stripe', live: /^sk_live_/.test(key),
    async createSession(order, urls) {
      if (!/^sk_(test|live)_/.test(key)) { const e = new Error('Stripe no está configurado (falta STRIPE_SECRET_KEY de prueba)'); e.status = 503; throw e; }
      const f = new URLSearchParams();
      f.set('mode', 'payment');
      f.set('success_url', urls.success); f.set('cancel_url', urls.cancel);
      f.set('client_reference_id', order.id);
      f.set('metadata[orderId]', order.id); f.set('metadata[biz]', order.biz);
      f.set('payment_intent_data[metadata][orderId]', order.id); f.set('payment_intent_data[metadata][biz]', order.biz);
      f.set('line_items[0][quantity]', '1');
      f.set('line_items[0][price_data][currency]', order.currency.toLowerCase());
      f.set('line_items[0][price_data][unit_amount]', String(order.amount));
      f.set('line_items[0][price_data][product_data][name]', 'StockSoft · licencia ' + order.label);
      if (order.email) f.set('customer_email', order.email);
      const r = await doFetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST', body: f.toString(),
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': 'order-' + order.id }
      });
      const j = await r.json();
      if (!r.ok) { const e = new Error('Stripe: ' + ((j.error && j.error.message) || r.status)); e.status = 502; throw e; }
      return { ref: j.id, url: j.url };
    },
    verify(raw, headers, now) {
      if (!whsec) throw new SigError('Stripe: falta STRIPE_WEBHOOK_SECRET');
      const h = parseHeader(headers['stripe-signature'], ',');
      const t = Number((h.t || [])[0]);
      if (!t || !(h.v1 || []).length) throw new SigError('Falta la firma');
      if (Math.abs((now || Date.now()) / 1000 - t) > TOLERANCE) throw new SigError('Firma caducada');
      const exp = hmac(whsec, t + '.' + raw);
      if (!h.v1.some(v => safeEq(v, exp))) throw new SigError('Firma no válida');
      let ev; try { ev = JSON.parse(raw); } catch (x) { throw new SigError('Cuerpo no válido'); }
      const o = (ev.data && ev.data.object) || {}, md = o.metadata || {};
      const base = { id: String(ev.id || ''), orderId: md.orderId || o.client_reference_id || '', ref: o.id || '' };
      switch (ev.type) {
        case 'checkout.session.completed':
        case 'checkout.session.async_payment_succeeded':
          // Con métodos asíncronos "completed" llega antes de cobrar: solo cuenta si payment_status es 'paid'.
          if (o.payment_status !== 'paid') return { ...base, type: 'ignore' };
          return { ...base, type: 'paid', amount: Number(o.amount_total), currency: String(o.currency || '').toUpperCase() };
        case 'checkout.session.async_payment_failed': return { ...base, type: 'failed' };
        case 'checkout.session.expired': return { ...base, type: 'canceled' };
        case 'charge.refunded':
          // Solo un reembolso TOTAL quita la licencia; los parciales quedan registrados para revisión manual.
          return { ...base, type: o.amount_refunded >= o.amount ? 'refunded' : 'partial_refund', amount: Number(o.amount_refunded), currency: String(o.currency || '').toUpperCase() };
        default: return { ...base, type: 'ignore' };
      }
    }
  };
}
module.exports = { create };
