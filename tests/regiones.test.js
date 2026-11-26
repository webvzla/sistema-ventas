// Pruebas unitarias del motor regional (web/regiones.js) y del catálogo de licencias (web/precios.js).
const R = require('../web/regiones.js'), P = require('../web/precios.js');
const { T, end } = require('./lib/t').suite('regiones');
const D = 864e5, NOW = Date.UTC(2026, 11, 10, 12);

// --- Región ---
{ const r = R.fromConfig({}); T('R1', 'Negocio sin país guardado = Venezuela heredada (BCV, IGTF, IVA 16/8/0, USD)', r.code === 'VE' && r.legacy && r.features.bcv && r.features.igtf && r.tax.rates.join() === '16,8,0' && r.currency.code === 'USD', r); }
{ const r = R.fromConfig({ cc: '34' }); T('R2', 'Sin país y prefijo no venezolano: sigue en VE (sin cambio automático) pero marcado como dudoso', r.code === 'VE' && r.uncertain, { code: r.code, uncertain: r.uncertain }); }
{ const r = R.fromConfig({ country: 'ES' }); T('R3', 'España: EUR, Europe/Madrid, IVA 21/10/4/0, sin BCV ni IGTF, NIF, Bizum', r.currency.code === 'EUR' && r.tz === 'Europe/Madrid' && r.tax.rates.join() === '21,10,4,0' && !r.features.bcv && !r.features.igtf && r.taxId === 'NIF' && r.methods.bizum, r); }
{ const r = R.fromConfig({ country: 'US' }); T('R4', 'EE. UU.: USD, sin BCV, impuesto configurable por el negocio (0 % por defecto)', r.currency.code === 'USD' && !r.features.bcv && r.tax.custom && r.tax.def === 0, r.tax); }
{ const r = R.fromConfig({ country: 'US', taxRates: [8.875, 'x', -3, 99] }); T('R5', 'Tipos propios: se filtran valores no válidos y siempre existe 0 %', r.tax.rates.join() === '8.875,0' && r.tax.def === 8.875, r.tax.rates); }
{ const r = R.fromConfig({ country: 'ZZ' }); T('R6', 'País desconocido = Venezuela (no se rompe)', r.code === 'VE', r.code); }
{ const r = R.fromConfig({ country: 'XX', currency: 'PEN', tz: 'America/Lima' }); T('R7', '"Otro país" con moneda y zona horaria propias', r.currency.code === 'PEN' && r.tz === 'America/Lima', { cur: r.currency.code, tz: r.tz }); }
{ const r = R.fromConfig({ country: 'ES', tz: 'Mars/Base' }); T('R8', 'Zona horaria no válida se ignora', r.tz === 'Europe/Madrid', r.tz); }
{ const all = Object.values(R.REGIONS); const keys = new Map(); let clash = null;
  for (const r of all) for (const [k, , cur] of r.payments) { if (keys.has(k) && keys.get(k) !== cur) clash = k; keys.set(k, cur); }
  T('R9', 'Ninguna forma de pago usa la misma clave con monedas distintas entre países (las ventas antiguas se leen bien)', !clash, clash); }
{ T('R10', 'Formatos de dinero: 1234,50 € · $1,234.50 · $1.235 (COP sin decimales)', R.money(1234.5, R.get('ES')) === '1234,50 €' || R.money(1234.5, R.get('ES')) === '1.234,50 €', R.money(1234.5, R.get('ES')));
  T('R11', 'Formato EE. UU. con coma de miles y punto decimal', R.money(1234.5, R.get('US')) === '$1,234.50', R.money(1234.5, R.get('US')));
  T('R12', 'COP sin decimales', R.money(1234.5, R.get('CO')) === '$1.235' || R.money(1234.5, R.get('CO')) === '$1235', R.money(1234.5, R.get('CO'))); }
{ const d = R.diff({}, 'ES', { eurProducts: 3, sales: 120 }); const k = d.map(x => x.k);
  T('R13', 'Vista previa VE→ES: moneda, BCV, IGTF, impuestos, pagos, zona, histórico intacto, productos en € y aviso fiscal', ['currency', 'bcv', 'igtf', 'tax', 'pay', 'tz', 'hist', 'eur', 'fiscal'].every(x => k.includes(x)), k); }
{ const d = R.diff({ country: 'ES' }, 'VE'); T('R14', 'Vista previa ES→VE avisa de que se activa BCV', d.some(x => x.k === 'bcv' && /activan/.test(x.t)), d); }
{ T('R15', 'Mismo país: sin cambios', R.diff({ country: 'ES' }, 'ES').length === 0); }

// --- Países sin configuración propia, monedas e impuestos del negocio ---
{ const c = R.fromConfig({ country: 'CO' }), m = R.fromConfig({ country: 'MX' }), e = R.fromConfig({ country: 'ES' });
  T('R16', 'Monedas: Colombia COP $ sin decimales, México MXN $, España EUR €; ninguno con BCV', c.currency.code === 'COP' && c.currency.dec === 0 && m.currency.code === 'MXN' && e.currency.symbol === '€' && ![c, m, e].some(r => r.features.bcv), [c.currency, m.currency, e.currency]); }
{ const r = R.fromConfig({ country: 'PE' });
  T('R17', 'País sin configuración (Perú): PEN S/, sin BCV y SIN ningún impuesto asumido (se configura a mano)', r.currency.code === 'PEN' && r.currency.symbol === 'S/' && !r.features.bcv && r.taxes.length === 0 && r.taxUnset && r.tax.def === 0 && r.methods.efectivo, { cur: r.currency, taxes: r.taxes, unset: r.taxUnset }); }
{ const r = R.fromConfig({ country: 'GB' }), cl = R.fromConfig({ country: 'CL' });
  T('R18', 'Moneda coherente con el país aunque no esté configurado: Reino Unido GBP £, Chile CLP sin decimales', r.currency.code === 'GBP' && r.currency.symbol === '£' && cl.currency.code === 'CLP' && cl.currency.dec === 0, [r.currency, cl.currency]); }
{ const r = R.fromConfig({ country: 'PE', taxes: [{ id: 'igv', name: 'IGV', rate: 18, inc: true }, { id: 'isc', name: 'ISC', rate: 10, inc: false }, { name: 'malo', rate: -1 }], taxDef: 'igv' });
  T('R19', 'Impuestos propios: nombre, %, incluido o sumado aparte, por defecto; se descartan los no válidos', r.taxes.length === 2 && r.taxDef.id === 'igv' && r.taxes[1].inc === false && r.tax.rates.join() === '18,10,0' && !r.taxUnset, r.taxes); }
{ const r = R.fromConfig({ country: 'ES', taxes: [], taxDef: '' });
  T('R20', 'El administrador puede dejar el negocio sin impuestos (lista vacía) aunque el país tenga sugeridos', r.taxes.length === 0 && r.taxCustom && !r.taxUnset && r.tax.def === 0); }
{ const r = R.fromConfig({ country: 'VE', taxes: [{ id: 'x', name: 'IVA', rate: 16 }], taxDef: 'x' }), v = R.fromConfig({});
  T('R21', 'Venezuela sin configurar = IVA 16/8 incluidos de siempre (p16 por defecto, 0 = Exento)', v.taxes.map(t => t.rate + ':' + t.inc).join() === '16:true,8:true' && v.taxDef.id === 'p16' && v.tax.labels[0] === 'Exento' && r.taxes.length === 1, v.taxes); }
{ const d = R.diff({ country: 'ES', taxes: [{ id: 'a', name: 'IVA', rate: 21 }] }, 'PE'); const u = R.diff({ country: 'ES' }, 'PE');
  T('R22', 'Cambio de país: los impuestos propios se conservan; a un país sin configuración no se le asume ninguno', d.some(x => x.k === 'tax' && /conservan/.test(x.t)) && u.some(x => x.k === 'tax' && /no se asume/.test(x.t)), [d, u]); }
{ const rules = require('fs').readFileSync(require('path').join(__dirname, '..', 'firestore.rules'), 'utf8'); const m = rules.match(/country in \[([^\]]+)\]/); const inRules = m ? m[1].match(/'([A-Z]{2})'/g).map(x => x.slice(1, 3)).sort().join() : '';
  T('R23', 'Las reglas admiten exactamente los países del catálogo', inRules === [...Object.keys(R.REGIONS), ...Object.keys(R.COUNTRIES)].sort().join(), inRules); }

// --- Documentos, modalidad de precios y número fiscal ---
{ const v = R.fromConfig({}), e = R.fromConfig({ country: 'ES' }), m = R.fromConfig({ country: 'MX' });
  T('D1', 'Documentos: Venezuela factura fiscal + nota de entrega (con consumidor final); España venta sin documento, factura simplificada (por defecto), completa y nota de entrega', v.docs.kinds.join() === 'fiscal,nota' && v.docs.cf && e.docs.kinds.join() === 'venta,simple,fiscal,nota' && e.docs.labels.nota === 'Nota de entrega' && e.docs.def === 'simple' && e.docs.labels.simple === 'Factura simplificada' && !e.docs.cf && m.docs.kinds.join() === 'venta,simple,fiscal,nota' && m.docs.def === 'venta', [v.docs, e.docs]); }
{ T('D2', 'Modalidad de precios por defecto: España y Venezuela con impuestos incluidos, EE. UU. sin incluir', R.fromConfig({ country: 'ES' }).taxMode === 'inc' && R.fromConfig({}).taxMode === 'inc' && R.fromConfig({ country: 'US' }).taxMode === 'exc');
  const x = R.fromConfig({ country: 'ES', taxMode: 'exc' });
  T('D3', 'El negocio elige "no incluyen": todos sus impuestos pasan a sumarse al cobrar', x.taxMode === 'exc' && x.taxes.every(t => t.inc === false) && x.taxModeSet, x.taxes);
  const mx = R.fromConfig({ country: 'PE', taxes: [{ id: 'a', name: 'IGV', rate: 18, inc: true }, { id: 'b', name: 'R', rate: 10, inc: false }] });
  T('D4', 'Impuestos propios anteriores con modos distintos se respetan ("mixto") hasta que se elija una modalidad', mx.taxMode === 'mixed' && mx.taxes[0].inc && !mx.taxes[1].inc && R.fromConfig({ country: 'PE', taxMode: 'inc', taxes: mx.taxes }).taxes.every(t => t.inc)); }
{ const ok = (c, v) => R.validTaxId(c, v).ok;
  T('D5', 'NIF de España: DNI, NIE y CIF con dígito de control; letra incorrecta rechazada', ok('ES', '12345678Z') && !ok('ES', '12345678A') && ok('ES', 'X1234567L') && ok('ES', 'b-1234567-4') && !ok('ES', '1234'));
  T('D6', 'Nunca valores de relleno fuera de Venezuela: V00000000 rechazado en España (y en México); en Venezuela sigue siendo el consumidor final', !ok('ES', 'V00000000') && !ok('MX', '000000000000') && ok('VE', 'V00000000'));
  T('D7', 'RFC de México y NIT de Colombia', ok('MX', 'GODE561231GR8') && !ok('MX', 'ABC') && ok('CO', '900123456') && !ok('CO', 'ABC')); }

// --- Precios ---
const ctx = (o) => ({ now: NOW, store: { promoStart: NOW - 10 * D }, isNew: true, ...o });
{ const q = ['m1', 'm3', 'm6', 'm12'].map(d => P.quote('VE', d, { now: NOW, store: {}, isNew: true }));
  T('P1', 'Precios normales VE: 5,99 · 16,99 · 29,99 · 49,99 USD', q.map(x => x.final).join() === '599,1699,2999,4999' && q.every(x => x.currency === 'USD' && !x.promo), q.map(x => x.final)); }
{ const q = ['m1', 'm3', 'm6', 'm12'].map(d => P.quote('VE', d, ctx()));
  T('P2', 'Promoción −20 %: 4,79 · 13,59 · 23,99 · 39,99 USD con precio normal visible', q.map(x => x.final).join() === '479,1359,2399,3999' && q.every(x => x.promo && x.pct === 20) && q[0].normal === 599, q.map(x => [x.normal, x.final, x.pct])); }
{ const q = P.quote('VE', 'm1', ctx({ now: NOW - 11 * D })); T('P3', 'Antes del inicio de la promoción: precio normal', !q.promo && q.final === 599, q); }
{ const q = P.quote('VE', 'm1', ctx({ now: NOW + 50 * D })); T('P4', 'Fin de la promoción (día 60): precio normal', !q.promo && q.final === 599, q); }
{ const q = P.quote('VE', 'm1', ctx({ now: NOW + 49 * D })); T('P5', 'Día 59 de la promoción: todavía con descuento', q.promo && q.final === 479, q); }
{ const q = P.quote('VE', 'm12', ctx({ isNew: false })); T('P6', 'Renovación / cliente no nuevo: sin descuento aunque haya promoción', !q.promo && q.final === 4999, q); }
{ const q = P.quote('VE', 'm1', ctx({ store: {} })); T('P7', 'Sin fecha de inicio configurada: no hay promoción', !q.promo, q); }
{ T('P8', 'Sin precio aprobado para España/EE. UU.: no se inventa (null)', P.quote('ES', 'm1', ctx()) === null && P.offers('US', ctx()).length === 0); }
{ T('P9', 'Duración inexistente o manipulada: null', P.quote('VE', 'm24', ctx()) === null && P.quote('VE', '__proto__', ctx()) === null && P.quote('VE', 'normal', ctx()) === null); }
{ const a = P.addMonths(Date.UTC(2026, 0, 31), 1), b = P.addMonths(Date.UTC(2026, 0, 31), -1);
  T('P10', 'Sumar meses: 31 ene + 1 mes = 28 feb; −1 mes = 31 dic', new Date(a).toISOString().slice(0, 10) === '2026-02-28' && new Date(b).toISOString().slice(0, 10) === '2025-12-31', [new Date(a).toISOString(), new Date(b).toISOString()]); }
{ T('P11', 'Formato de precio: $4,79', P.fmt(479, 'USD') === '$4,79', P.fmt(479, 'USD')); }

process.exit(end() ? 0 : 1);
