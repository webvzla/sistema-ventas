/* Adaptador de Paddle Billing (merchant of record). PREPARADO, no conectado.
   - Verificación de webhooks implementada y probada (Paddle-Signature: ts=…;h1=HMAC(ts:cuerpo)).
   - El checkout de Paddle se abre con Paddle.js y necesita una cuenta aprobada, price IDs y el dominio verificado:
     createSession devuelve 503 hasta que existan (ver informe: qué falta para habilitarlo). */
const { hmac, safeEq, parseHeader, SigError } = require('./firma');
const TOLERANCE = 300;

function create(env) {
  const whsec = env.PADDLE_WEBHOOK_SECRET || '';
  return {
    id: 'paddle', live: env.PADDLE_ENV === 'production',
    async createSession() { const e = new Error('Paddle aún no está habilitado: falta cuenta aprobada y precios en Paddle'); e.status = 503; throw e; },
    verify(raw, headers, now) {
      if (!whsec) throw new SigError('Paddle: falta PADDLE_WEBHOOK_SECRET');
      const h = parseHeader(headers['paddle-signature'], ';');
      const ts = Number((h.ts || [])[0]);
      if (!ts || !(h.h1 || []).length) throw new SigError('Falta la firma');
      if (Math.abs((now || Date.now()) / 1000 - ts) > TOLERANCE) throw new SigError('Firma caducada');
      const exp = hmac(whsec, ts + ':' + raw);
      if (!h.h1.some(v => safeEq(v, exp))) throw new SigError('Firma no válida');
      let ev; try { ev = JSON.parse(raw); } catch (x) { throw new SigError('Cuerpo no válido'); }
      const d = ev.data || {}, cd = d.custom_data || {};
      const base = { id: String(ev.event_id || ''), orderId: cd.orderId || '', ref: d.id || '' };
      switch (ev.event_type) {
        case 'transaction.completed': {
          const tot = (d.details && d.details.totals) || {};
          return { ...base, type: 'paid', amount: Number(tot.grand_total), currency: String(d.currency_code || '').toUpperCase() };
        }
        case 'transaction.payment_failed': return { ...base, type: 'failed' };
        case 'adjustment.created':
        case 'adjustment.updated':
          if (d.action === 'refund' && d.status === 'approved') {
            return { ...base, orderId: cd.orderId || '', ref: d.transaction_id || '', type: d.type === 'full' ? 'refunded' : 'partial_refund' };
          }
          return { ...base, type: 'ignore' };
        default: return { ...base, type: 'ignore' };
      }
    }
  };
}
module.exports = { create };
