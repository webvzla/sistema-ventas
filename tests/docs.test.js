// La base de conocimiento del futuro asistente (docs/asistente) debe seguir coincidiendo con la app:
// archivos y fichas completas, nombres de pantallas y botones que existen de verdad y nada privado.
const fs = require('fs'), path = require('path');
const { T, end } = require('./lib/t').suite('docs');
const D = path.join(__dirname, '..', 'docs', 'asistente');
const APP = fs.readFileSync(path.join(__dirname, '..', 'web', 'index.html'), 'utf8');
const idx = JSON.parse(fs.readFileSync(path.join(D, 'indice.json'), 'utf8'));

const missingFiles = idx.modulos.filter(m => !fs.existsSync(path.join(D, m.archivo))).map(m => m.archivo);
T('K1', 'Cada módulo del índice tiene su archivo', !missingFiles.length, missingFiles);
const badHead = idx.modulos.filter(m => { const t = fs.readFileSync(path.join(D, m.archivo), 'utf8'); return !/^---\nid: /.test(t.replace(/\r\n/g, '\n')) || !/\nverificado: /.test(t) || !/Disponible|Problemas frecuentes|Limitaciones/.test(t); }).map(m => m.archivo);
T('K2', 'Cada archivo tiene su ficha (id, verificado) y separa lo disponible de lo pendiente', !badHead.length, badHead);
const notInApp = []; idx.modulos.forEach(m => m.ui.forEach(u => { if (!APP.includes(u)) notInApp.push(m.id + ': ' + u); }));
T('K3', 'Todos los nombres de pantallas y botones citados en el índice existen en la app (si cambian, actualizar la documentación)', !notInApp.length, notInApp);
const all = fs.readdirSync(D).map(f => fs.readFileSync(path.join(D, f), 'utf8')).join('\n');
const secrets = [/AIza[0-9A-Za-z_-]{20,}/, /sk_(live|test)_[0-9A-Za-z]{8,}/, /whsec_[0-9A-Za-z]{8,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /[A-Za-z0-9._%+-]+@(gmail|hotmail|outlook|yahoo)\.com/i, /\b\d{9,}\b/];
const hits = secrets.filter(r => r.test(all)).map(String);
T('K4', 'Sin claves, credenciales, correos personales ni números privados en la documentación', !hits.length, hits);
const files = fs.readdirSync(D).filter(f => /\.md$/.test(f) && f !== 'README.md'), orphan = files.filter(f => !idx.modulos.some(m => m.archivo === f));
T('K5', 'No hay archivos de documentación fuera del índice', !orphan.length, orphan);
process.exit(end() ? 0 : 1);
