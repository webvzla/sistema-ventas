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
