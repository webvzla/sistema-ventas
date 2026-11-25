/* Adaptador de PayPal. PENDIENTE: PayPal no firma sus webhooks con un secreto compartido; hay que verificar
   cada evento llamando a su API (/v1/notifications/verify-webhook-signature) con credenciales de una cuenta
   Business. Sin cuenta no se puede probar, así que este adaptador rechaza todo de forma explícita. */
const { SigError } = require('./firma');
function create() {
  return {
    id: 'paypal', live: false,
    async createSession() { const e = new Error('PayPal no está habilitado (falta cuenta Business y verificación por API)'); e.status = 503; throw e; },
    verify() { throw new SigError('PayPal no está habilitado'); }
  };
}
module.exports = { create };
