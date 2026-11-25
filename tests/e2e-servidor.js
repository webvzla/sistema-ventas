// Entorno local para probar la app en el navegador SIN Firebase real:
//  - carga firestore.rules en el emulador (que debe estar arrancado: npx firebase emulators:start --config firebase.json --project demo-stocksoft)
//  - sirve web/ en http://localhost:5173  (abrir http://localhost:5173/index.html?emu=1&api=http://localhost:5099)
//  - API de la tienda con la pasarela SIMULADA en http://localhost:5099
//  - crea el usuario "dueño del sistema" de pruebas (mismo uid que en las reglas) con contraseña de prueba.
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
const http = require('http'), fs = require('fs'), path = require('path');
const admin = require('firebase-admin');
const { createApi } = require('../functions/lib/api');
const proveedores = require('../functions/lib/proveedores');
const WEB = path.join(__dirname, '..', 'web');
const OWNER = '3Wuh1CLsC2XeIS58uXkRSlQIXHJ2';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };

(async () => {
  const rules = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const r = await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-stocksoft:securityRules', { method: 'PUT', body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: rules }] } }) });
  console.log('reglas cargadas en el emulador:', r.status);
  admin.initializeApp({ projectId: 'demo-stocksoft' });
  try { await admin.auth().createUser({ uid: OWNER, email: 'dueno@prueba.test', password: 'dueno-prueba-1' }); } catch (e) {}
  http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/index.html';
    const f = path.join(WEB, path.normalize(p).replace(/^([\\/])+/, ''));
    if (!f.startsWith(WEB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('no'); }
    res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); res.setHeader('Cache-Control', 'no-store'); fs.createReadStream(f).pipe(res);
  }).listen(5173, () => console.log('app: http://localhost:5173/index.html?emu=1&api=http://localhost:5099'));
  const env = { SIMULADOR: '1', SIM_SECRET: 'sim-secret-local-e2e-0001', PAYMENT_PROVIDER: 'simulador', APP_URL: 'http://localhost:5173/index.html', API_BASE: 'http://localhost:5099', ALLOWED_ORIGINS: 'http://localhost:5173' };
  const api = createApi({ db: admin.firestore(), auth: admin.auth(), providers: proveedores.load(env), env, notify: async m => console.log('AVISO AL CLIENTE', m.kind, m.email, m.to ? new Date(m.to).toISOString() : '') });
  http.createServer(api.handle).listen(5099, () => console.log('api: http://localhost:5099'));
})();
