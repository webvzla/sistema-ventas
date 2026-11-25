// Funciones reales de la app (extraídas de web/index.html) para impuestos y configuración inicial por región.
// Incluye la regresión del defecto encontrado en el navegador: Firestore NO admite listas dentro de listas.
const fs = require('fs'), path = require('path'), vm = require('vm');
const SSRegion = require('../web/regiones.js');
const { T, end } = require('./lib/t').suite('app');
const H = fs.readFileSync(path.join(__dirname, '..', 'web', 'index.html'), 'utf8');
const cut = (from, to) => { const a = H.indexOf(from), b = H.indexOf(to, a); if (a < 0 || b < 0) throw new Error('No se encontró ' + from); return H.slice(a, b); };
const src = [cut('function taxCalc(', 'function taxHtml('), cut('function newBizCfg(', 'function regionStats(')].join('\n');
const DEF = H.match(/const DEF_CFG = (\{[^;]+\});/)[1];
function env(country, extra) {
  const ctx = { SSRegion, REG: SSRegion.fromConfig({ country }), cfg: { igtf: true, ...(extra || {}) }, num: v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : 0; }, r2: n => Math.round(n * 100) / 100 };
  vm.createContext(ctx); vm.runInContext('const DEF_CFG = ' + DEF + ';\n' + src + ';this.taxCalc=taxCalc;this.taxRows=taxRows;this.taxIva=taxIva;this.newBizCfg=newBizCfg;', ctx);
  return ctx;
}
const nested = v => Array.isArray(v) ? v.some(x => Array.isArray(x) || nested(x)) : v && typeof v === 'object' ? Object.values(v).some(nested) : false;
const items = [{ price: 8.5, qty: 1, iva: 10 }, { price: 4.2, qty: 1, iva: 21 }, { price: 1, qty: 2, iva: 0 }];
{ const e = env('ES'); const t = e.taxCalc(items, 0);
  T('A1', 'España: desglose 21 % y 10 % correcto (precio con IVA incluido) y exento', t.rows.length === 2 && t.rows[0].r === 21 && t.rows[0].b === 3.47 && t.rows[0].i === 0.73 && t.rows[1].r === 10 && t.rows[1].b === 7.73 && t.ex === 2 && t.total === 14.7, t);
  T('A2', 'Regresión: la venta no contiene listas anidadas (Firestore las rechaza)', !nested({ tax: { rows: t.rows } }), t.rows);
  T('A3', 'España: sin IGTF aunque la configuración diga igtf:true (petición manipulada)', t.igtf === 0, t.igtf); }
{ const e = env('VE'); const t = e.taxCalc([{ price: 1.16, qty: 1, iva: 16 }, { price: 1.08, qty: 1, iva: 8 }, { price: 1, qty: 1 }], 2);
  T('A4', 'Venezuela: campos de siempre (b16/i16/b8/i8) intactos, producto sin IVA usa 16 % e IGTF 3 % sobre divisas', t.b16 === 1.86 && t.i16 === 0.3 && t.b8 === 1 && t.i8 === 0.08 && t.igtf === 0.06, t);
  T('A5', 'Venta antigua (sin rows) se sigue leyendo: taxRows usa b16/b8', JSON.stringify(e.taxRows({ b16: 10, i16: 1.6, b8: 5, i8: 0.4 })) === '[[16,10,1.6],[8,5,0.4]]' && e.taxIva({ b16: 10, i16: 1.6, b8: 5, i8: 0.4 }) === 2);
  T('A6', 'Venta nueva con rows en objetos: taxIva suma todos los tipos', Math.abs(e.taxIva({ rows: [{ r: 21, b: 10, i: 2.1 }, { r: 10, b: 5, i: 0.5 }] }) - 2.6) < 1e-9); }
{ const e = env('ES'); const c = e.newBizCfg({ country: 'ES', name: 'X' });
  T('A7', 'Regresión: negocio nuevo de España se crea SIN campos BCV ni IGTF (las reglas los rechazarían)', !SSRegion.BCV_KEYS.some(k => k in c) && !('igtf' in c) && c.name === 'X', Object.keys(c));
  const v = e.newBizCfg({ country: 'VE', name: 'Y' });
  T('A8', 'Negocio nuevo de Venezuela conserva bcv/eur/igtf por defecto', 'bcv' in v && 'igtf' in v, Object.keys(v)); }
process.exit(end() ? 0 : 1);
