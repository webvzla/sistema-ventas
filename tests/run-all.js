// Ejecuta todas las suites. Las de emulador necesitan los emuladores arrancados:
//   npx firebase emulators:exec --config firebase.json --project demo-stocksoft --only firestore,auth "node run-all.js"
const { spawnSync } = require('child_process');
let ok = true;
for (const f of ['regiones.test.js', 'app.test.js', 'reglas.test.js', 'tienda.test.js']) {
  const r = spawnSync(process.execPath, [f], { stdio: 'inherit', cwd: __dirname, env: process.env });
  if (r.status !== 0) ok = false;
}
console.log(ok ? '\nTODAS LAS PRUEBAS PASAN' : '\nHAY PRUEBAS QUE FALLAN'); process.exit(ok ? 0 : 1);
