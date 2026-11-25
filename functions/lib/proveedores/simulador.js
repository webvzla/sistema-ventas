/* Pasarela SIMULADA para el entorno de pruebas. No mueve dinero.
   El "checkout" es una página del propio servidor (/sim/checkout) con botones Aprobar / Rechazar / Reembolsar.
   El resultado llega como un webhook firmado con SIM_SECRET (mismo esquema que Stripe: t=…,v1=HMAC(t.cuerpo)),
   así que el núcleo de licencias recorre exactamente el mismo camino que con una pasarela real. */
const { hmac, safeEq, parseHeader, SigError } = require('./firma');
const TOLERANCE = 300; // segundos

function create(env) {
  const secret = env.SIM_SECRET;
  if (!secret || secret.length < 16) throw new Error('Simulador: falta SIM_SECRET (mínimo 16 caracteres)');
  return {
    id: 'simulador', live: false,
    async createSession(order, urls) {
      return { ref: 'sim_' + order.id, url: urls.base + '/sim/checkout?order=' + encodeURIComponent(order.id) };
    },
    // Firma un evento (lo usa la página del simulador y las pruebas).
    sign(body, t) { t = t || Math.floor(Date.now() / 1000); return 't=' + t + ',v1=' + hmac(secret, t + '.' + body); },
    verify(raw, headers, now) {
      const h = parseHeader(headers['x-sim-signature'], ',');
      const t = Number((h.t || [])[0]);
      if (!t || !(h.v1 || []).length) throw new SigError('Falta la firma');
      if (Math.abs((now || Date.now()) / 1000 - t) > TOLERANCE) throw new SigError('Firma caducada');
      const exp = hmac(secret, t + '.' + raw);
      if (!h.v1.some(v => safeEq(v, exp))) throw new SigError('Firma no válida');
      let e; try { e = JSON.parse(raw); } catch (x) { throw new SigError('Cuerpo no válido'); }
      // Evento ya normalizado: {id, type: paid|failed|refunded|canceled, orderId, amount, currency, ref}
      return { id: String(e.id || ''), type: e.type, orderId: e.orderId, amount: Number(e.amount), currency: e.currency, ref: e.ref || '' };
    }
  };
}
module.exports = { create };
