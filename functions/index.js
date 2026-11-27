/* Cloud Functions de StockSoft (tienda de licencias). NO DESPLEGADO.
   Desplegar exige el plan Blaze del proyecto de Firebase (decisión y coste pendientes de Francisco) y la
   autorización expresa de lanzamiento. Mientras tanto se prueba con los emuladores (ver tests/).
   Variables (secretos de Functions): PAYMENT_PROVIDER, STRIPE_SECRET_KEY (sk_test_…), STRIPE_WEBHOOK_SECRET,
   POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, POLAR_PRODUCT_ID, POLAR_SERVER (sandbox), POLAR_TAX,
   PADDLE_WEBHOOK_SECRET, ALLOWED_ORIGINS, APP_URL, API_BASE. Nunca SIMULADOR=1 junto a LIVE_PAYMENTS. */
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { createApi } = require('./lib/api');
const proveedores = require('./lib/proveedores');

admin.initializeApp();
let api = null;
exports.tienda = onRequest({ region: 'europe-west1', maxInstances: 3, memory: '256MiB' }, (req, res) => {
  if (!api) api = createApi({ db: admin.firestore(), auth: admin.auth(), providers: proveedores.load(process.env), env: process.env });
  return api.handle(req, res);
});
