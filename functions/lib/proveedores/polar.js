/* Adaptador de Polar (merchant of record: Polar es el vendedor legal, cobra y liquida el IVA de cada país).
   SOLO SANDBOX: usa https://sandbox-api.polar.sh salvo POLAR_SERVER=production, que además exige
   LIVE_PAYMENTS === 'autorizado' (no se configura sin la autorización expresa de Francisco).
   Variables: POLAR_ACCESS_TOKEN (token de la organización), POLAR_WEBHOOK_SECRET, POLAR_PRODUCT_ID (producto
   «Licencia StockSoft» creado en Polar), POLAR_SERVER (sandbox | production), POLAR_TAX (exclusive | inclusive).
   - El precio lo pone el servidor en cada checkout (precio ad hoc sobre el producto); el catálogo de Polar no manda.
   - Webhooks firmados con Standard Webhooks: HMAC-SHA256(id.timestamp.cuerpo) en base64, clave = el secreto tal cual
     (igual que validateEvent del SDK oficial @polar-sh/sdk).
   - La casilla de aceptación de términos y reembolsos se crea en Polar como campo personalizado «checkbox»
     obligatorio y se adjunta al producto (no se puede enviar desde la API). */
const crypto = require('crypto');
const { safeEq, SigError } = require('./firma');
const TOLERANCE = 300;

function create(env, deps) {
  deps = deps || {};
  const token = env.POLAR_ACCESS_TOKEN || '', whsec = env.POLAR_WEBHOOK_SECRET || '', product = env.POLAR_PRODUCT_ID || '';
  const live = env.POLAR_SERVER === 'production';
  if (live && env.LIVE_PAYMENTS !== 'autorizado') throw new Error('Polar: producción bloqueada (solo sandbox sin autorización de lanzamiento)');
  const base = live ? 'https://api.polar.sh' : 'https://sandbox-api.polar.sh';
  const inclusive = env.POLAR_TAX === 'inclusive';
  const doFetch = deps.fetch || (typeof fetch === 'function' ? fetch : null);
  return {
    id: 'polar', live,
    async createSession(order, urls) {
      if (!token || !product) { const e = new Error('Polar no está configurado (faltan POLAR_ACCESS_TOKEN y POLAR_PRODUCT_ID)'); e.status = 503; throw e; }
      const body = {
        products: [product],
        prices: { [product]: [{ amount_type: 'fixed', price_amount: order.amount, price_currency: order.currency.toLowerCase(), tax_behavior: inclusive ? 'inclusive' : 'exclusive' }] },
        metadata: { orderId: order.id, biz: order.biz, label: order.label },
        external_customer_id: order.biz,
        allow_discount_codes: false, allow_trial: false,
        success_url: urls.success, return_url: urls.cancel, locale: 'es'
      };
      if (order.email) body.customer_email = order.email;
      const r = await doFetch(base + '/v1/checkouts/', {
        method: 'POST', body: JSON.stringify(body),
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json' }
      });
      const j = await r.json();
      if (!r.ok) { const e = new Error('Polar: ' + ((j && (j.detail && (j.detail.message || JSON.stringify(j.detail)) || j.error)) || r.status)); e.status = 502; throw e; }
      return { ref: j.id, url: j.url };
    },
    verify(raw, headers, now) {
      if (!whsec) throw new SigError('Polar: falta POLAR_WEBHOOK_SECRET');
      const id = String(headers['webhook-id'] || ''), ts = Number(headers['webhook-timestamp']), sigs = String(headers['webhook-signature'] || '');
      if (!id || !ts || !sigs) throw new SigError('Falta la firma');
      if (Math.abs((now || Date.now()) / 1000 - ts) > TOLERANCE) throw new SigError('Firma caducada');
      const exp = crypto.createHmac('sha256', Buffer.from(whsec, 'utf8')).update(id + '.' + ts + '.' + raw, 'utf8').digest('base64');
      if (!sigs.split(' ').some(s => { const [v, sig] = s.split(','); return v === 'v1' && safeEq(sig, exp); })) throw new SigError('Firma no válida');
      let ev; try { ev = JSON.parse(raw); } catch (x) { throw new SigError('Cuerpo no válido'); }
      const d = ev.data || {}, md = d.metadata || {};
      // El id del aviso (webhook-id) se repite en los reintentos: sirve para detectar duplicados.
      const baseEv = { id, orderId: md.orderId || '', ref: d.checkout_id || d.id || '' };
      switch (ev.type) {
        case 'order.paid':
          // Solo compras sueltas (las licencias son pago único); el importe que se compara es el precio sin impuestos.
          if (d.billing_reason && d.billing_reason !== 'purchase') return { ...baseEv, type: 'ignore' };
          return { ...baseEv, type: 'paid', amount: Number(inclusive ? d.total_amount : d.net_amount), currency: String(d.currency || '').toUpperCase() };
        case 'order.refunded':
          // Solo un reembolso TOTAL quita la licencia; los parciales quedan para revisión manual.
          return { ...baseEv, type: d.status === 'refunded' ? 'refunded' : 'partial_refund', amount: Number(d.refunded_amount), currency: String(d.currency || '').toUpperCase() };
        case 'checkout.expired': return { ...baseEv, ref: d.id || '', type: 'canceled' };
        case 'checkout.updated':
          if (d.status === 'failed') return { ...baseEv, ref: d.id || '', type: 'failed' };
          return { ...baseEv, type: 'ignore' };
        default: return { ...baseEv, type: 'ignore' };
      }
    }
  };
}
module.exports = { create };
