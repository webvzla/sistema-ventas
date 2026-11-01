// Permite abrir la app sin internet (los datos se sincronizan con Firebase al volver la conexión).
const CACHE = 'ventas-v1';
const CORE = ['./', 'index.html', 'firebase-config.js', 'manifest.webmanifest', 'icon.png',
  'vendor/jspdf.umd.min.js', 'vendor/JsBarcode.all.min.js', 'vendor/chart.umd.js', 'vendor/zxing.min.js',
  'vendor/firebase-app-compat.js', 'vendor/firebase-auth-compat.js', 'vendor/firebase-firestore-compat.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Red primero (para recibir actualizaciones), caché si no hay internet.
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
