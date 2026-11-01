// Copia las librerías a web/vendor para que la app funcione sin internet.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'web', 'vendor');
fs.mkdirSync(out, { recursive: true });
const libs = [
  ['jspdf.umd.min.js', ['jspdf/dist/jspdf.umd.min.js']],
  ['JsBarcode.all.min.js', ['jsbarcode/dist/JsBarcode.all.min.js']],
  ['chart.umd.js', ['chart.js/dist/chart.umd.min.js', 'chart.js/dist/chart.umd.js', 'chart.js/dist/chart.min.js']],
  ['zxing.min.js', ['@zxing/library/umd/index.min.js', '@zxing/library/umd/index.js']],
  ['firebase-app-compat.js', ['firebase/firebase-app-compat.js', 'firebase/compat/dist/firebase-app-compat.js']],
  ['firebase-auth-compat.js', ['firebase/firebase-auth-compat.js', 'firebase/compat/dist/firebase-auth-compat.js']],
  ['firebase-firestore-compat.js', ['firebase/firebase-firestore-compat.js', 'firebase/compat/dist/firebase-firestore-compat.js']]
];
let missing = 0;
for (const [name, candidates] of libs) {
  const found = candidates.map(c => path.join(root, 'node_modules', c)).find(p => fs.existsSync(p));
  if (!found) { console.error('✗ No encontrado:', name, candidates.join(' | ')); missing++; continue; }
  fs.copyFileSync(found, path.join(out, name));
  console.log('✓', name, '←', path.relative(root, found));
}
if (missing) { console.error(missing + ' librería(s) no encontradas'); process.exit(1); }
