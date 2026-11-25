// Catálogos compartidos con la app (web/precios.js y web/regiones.js). Una sola fuente de verdad:
// en el repositorio se leen de web/; al desplegar Functions, `npm run compartidos` los copia a functions/compartido/.
const path = require('path'), fs = require('fs');
function load(name) {
  const local = path.join(__dirname, '..', 'compartido', name);
  return require(fs.existsSync(local) ? local : path.join(__dirname, '..', '..', 'web', name));
}
module.exports = { P: load('precios.js'), R: load('regiones.js') };
