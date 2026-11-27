// Registro de pasarelas. El sistema de licencias solo conoce esta interfaz:
//   createSession(order, urls) -> {ref, url}      verify(rawBody, headers, now) -> evento normalizado
// Cambiar de proveedor = añadir un archivo aquí y poner PAYMENT_PROVIDER; el núcleo de licencias no cambia.
const FACT = { simulador: require('./simulador'), stripe: require('./stripe'), polar: require('./polar'), paddle: require('./paddle'), paypal: require('./paypal') };
function load(env, deps) {
  const out = {};
  for (const [id, m] of Object.entries(FACT)) {
    if (id === 'simulador' && env.SIMULADOR !== '1') continue; // el simulador solo existe si se activa a propósito
    try { out[id] = m.create(env, deps); } catch (e) { out[id] = { id, error: e.message, async createSession() { const x = new Error(e.message); x.status = 503; throw x; }, verify() { const x = new Error(e.message); x.status = 400; throw x; } }; }
  }
  return out;
}
module.exports = { load, ids: Object.keys(FACT) };
