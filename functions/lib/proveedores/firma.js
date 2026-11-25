// Firmas HMAC-SHA256 de webhooks, comparadas en tiempo constante.
const crypto = require('crypto');
const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
function safeEq(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8'), y = Buffer.from(String(b || ''), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
// Cabecera tipo "t=123,v1=abc" (Stripe y simulador) o "ts=123;h1=abc" (Paddle).
function parseHeader(h, sep) {
  const out = {};
  String(h || '').split(sep).forEach(p => { const i = p.indexOf('='); if (i > 0) { const k = p.slice(0, i).trim(); (out[k] = out[k] || []).push(p.slice(i + 1).trim()); } });
  return out;
}
class SigError extends Error { constructor(m) { super(m); this.status = 400; this.code = 'firma'; } }
module.exports = { hmac, safeEq, parseHeader, SigError };
