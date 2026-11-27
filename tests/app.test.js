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
{ const e = env('US', {}); e.REG = SSRegion.fromConfig({ country: 'US', taxes: [{ id: 'st', name: 'Sales tax', rate: 8.875, inc: false }], taxDef: 'st' });
  const t = e.taxCalc([{ price: 10, qty: 2, iva: 8.875, ivaN: 'Sales tax', ivaInc: false }, { price: 5, qty: 1, iva: 0 }], 0);
  T('A9', 'Impuesto que se suma aparte: base 20, impuesto 1,78 se añade al total (26,78); exento 5', t.sub === 25 && t.add === 1.78 && t.total === 26.78 && t.rows[0].x === true && t.rows[0].n === 'Sales tax' && t.ex === 5, t);
  T('A10', 'Regresión: venta con impuesto sumado tampoco contiene listas anidadas', !nested({ tax: { rows: t.rows } }), t.rows);
  T('A11', 'taxRows devuelve nombre y si se suma (para facturas y reportes)', JSON.stringify(e.taxRows({ rows: t.rows })[0]) === '[8.875,20,1.78,"Sales tax",true]', e.taxRows({ rows: t.rows })); }
{ const e = env('PE', {}); const t = e.taxCalc([{ price: 10, qty: 1 }], 0);
  T('A12', 'País sin impuestos configurados: se vende sin impuesto (no se asume ningún %)', t.total === 10 && t.rows.length === 0 && t.ex === 10, t); }
{ const e = env('PE', {}); e.REG = SSRegion.fromConfig({ country: 'PE', taxes: [{ id: 'igv', name: 'IGV', rate: 18 }], taxDef: 'igv' });
  const t = e.taxCalc([{ price: 11.8, qty: 1, iva: 18, ivaN: 'IGV' }], 0);
  T('A13', 'Impuesto propio incluido (IGV 18 %): base 10, IGV 1,80, total 11,80 sin sumar nada', t.total === 11.8 && t.add === 0 && t.rows[0].b === 10 && t.rows[0].i === 1.8 && t.rows[0].n === 'IGV', t); }
T('A14', 'Regresión: la app no busca países solo entre los configurados (fallaba al cambiar desde Perú)', !/SSRegion\.REGIONS\[/.test(H));
{ const e = env('ES', {}); const inc = e.taxCalc([{ price: 1.2, qty: 1, iva: 21, ivaN: 'IVA', ivaInc: true }], 0), exc = e.taxCalc([{ price: 1.2, qty: 1, iva: 21, ivaN: 'IVA', ivaInc: false }], 0);
  T('A15', 'Ejemplo de España con IVA incluido: precio 1,20 → base 0,99 + IVA 0,21 = 1,20', inc.rows[0].b === 0.99 && inc.rows[0].i === 0.21 && inc.total === 1.2 && inc.add === 0, inc);
  T('A16', 'Ejemplo de España sin IVA incluido: precio 1,20 → base 1,20 + IVA 0,25 = 1,45', exc.rows[0].b === 1.2 && exc.rows[0].i === 0.25 && exc.total === 1.45 && exc.add === 0.25, exc);
  const two = e.taxCalc([{ price: 1.2, qty: 2, iva: 21, ivaInc: false }, { price: 1.2, qty: 1, iva: 21, ivaInc: false }], 0);
  T('A17', 'Sin duplicar impuestos: tres unidades sin IVA incluido = 3,60 + 0,76 una sola vez (4,36)', two.rows.length === 1 && two.total === 4.36 && two.add === 0.76, two); }
T('A18', 'Consumidor final con V00000000 solo cuando el país lo permite (Venezuela), nunca fijo para todos', /REG\.docs\.cf \? `<button[^`]*V00000000/.test(H) && !/onclick="ui\.cust=\{rif:'V00000000'[^"]*"\>Consumidor final<\/button><\/div>\s*\n\s*<div class="grid2"><div><label>\$\{REG\.code === 'VE'/.test(H));
T('A19', 'Tutorial y Ayuda presentes: pasos sobre la interfaz real (navegación y Más) y buscador', /const TOUR = \[/.test(H) && /#nav button\[data-v="vender"\]/.test(H) && /function helpSearch/.test(H) && /window\.SSHelp/.test(H));
{ const src = H.match(/const ratesStale = \(\) => [^;]+;/)[0]; const run = (country, c) => { const ctx = { REG: SSRegion.fromConfig({ country }), cfg: c, Date }; vm.createContext(ctx); vm.runInContext(src + ';this.f=ratesStale;', ctx); return ctx.f(); };
  T('A20', 'Regresión: sin aviso de tasa desactualizada fuera de Venezuela; en Venezuela sí avisa si la tasa es vieja', run('ES', { bcv: 0, ratesAt: 0 }) === false && run('PE', {}) === false && run('VE', { bcv: 200, ratesAt: 0 }) === true && run('VE', { bcv: 200, ratesAt: Date.now() }) === false); }
{ const src = H.match(/const taxedDoc = s => [^;]+;/)[0]; const ctx = {}; vm.createContext(ctx); vm.runInContext(src + ';this.f=taxedDoc;', ctx); const f = ctx.f;
  T('A21', 'Nota de entrega: en Venezuela no tributa (como siempre); en otros países la venta tributa igual aunque el documento sea una nota', f({ doc: 'nota' }) === false && f({ doc: 'nota', rg: 'VE' }) === false && f({ doc: 'nota', rg: 'ES' }) === true && f({ doc: 'fiscal', rg: 'VE' }) === true && f({ doc: 'devolucion', rg: 'ES' }) === false); }
T('A22', 'Nota de entrega de una venta ya hecha: se numera en la MISMA venta (sin crear otra ni tocar el stock) y se ve, descarga e imprime', /async function makeNote\(id\)\{[\s\S]{0,200}put\('sales', id, \{\.\.\.s, noteNo\}\)/.test(H) && !/async function makeNote[\s\S]{0,900}put\('products'/.test(H.split('function printDoc')[0].slice(H.indexOf('async function makeNote'))) && /function printDoc\(\)/.test(H) && /viewFactura\('\$\{id\}','nota'\)/.test(H));
// Devoluciones en los informes: el impuesto devuelto se descuenta (calculado con los artículos devueltos, sin migrar datos).
{ const tdSrc = H.match(/const taxedDoc = s => [^;]+;/)[0];
  const mk = (country, sales) => { const e = env(country); e.S = { sales }; vm.runInContext(tdSrc + ';this.taxedDoc=taxedDoc;this.retTax=retTax;', e); return e; };
  // Colombia, IVA 19 % incluido: 2 × 10.710 (ya con el 10 % de descuento) = 21.420 → IVA 3.420; se devuelve 1 unidad.
  const it = { price: 10710, qty: 2, iva: 19, ivaN: 'IVA' };
  const co = mk('CO', {}); const tSale = co.taxCalc([it], 0); co.S.sales = { v1: { doc: 'nota', rg: 'CO', total: 21420, tax: tSale }, d1: { doc: 'devolucion', refOf: 'v1', total: -10710, items: [{ ...it, qty: -1 }] } };
  const ivaT = co.taxIva(co.S.sales.v1.tax) + co.retTax(co.S.sales.d1);
  T('A25', 'Colombia (IVA incluido): devolver 1 de 2 unidades deja el impuesto del informe en 1.710 (antes seguía en 3.420)', co.taxIva(tSale) === 3420 && co.retTax(co.S.sales.d1) === -1710 && ivaT === 1710, { ivaT, ret: co.retTax(co.S.sales.d1) });
  // Precios SIN impuestos incluidos: la devolución reembolsa precio + impuesto sumado.
  const ex = mk('CO', {}); const itx = { price: 10000, qty: -1, iva: 19, ivaInc: false, ivaN: 'IVA' }; const tr = ex.taxCalc([itx], 0);
  T('A26', 'Precios sin impuestos incluidos: devolver 1 unidad de 10.000 + 19 % reembolsa 11.900 y descuenta 1.900 de impuesto', ex.r2(tr.sub + tr.add) === -11900 && (ex.S.sales = { v: { doc: 'simple', rg: 'CO' }, d: { doc: 'devolucion', refOf: 'v', items: [itx] } }, ex.retTax(ex.S.sales.d)) === -1900, tr);
  // Venezuela: solo descuenta si la venta original era factura fiscal (la nota venezolana no tributa), como el informe actual.
  const ve = mk('VE', {}); const iv = { price: 11.6, qty: -1, iva: 16 };
  ve.S.sales = { f: { doc: 'fiscal' }, n: { doc: 'nota' }, df: { doc: 'devolucion', refOf: 'f', items: [iv] }, dn: { doc: 'devolucion', refOf: 'n', items: [iv] }, dx: { doc: 'devolucion', refOf: 'no-existe', items: [iv] } };
  T('A27', 'Venezuela: la devolución de una factura descuenta su IVA (1,60); la de una nota de entrega o de una venta que no está cargada no cambia nada; una venta normal no se ve afectada', ve.retTax(ve.S.sales.df) === -1.6 && ve.retTax(ve.S.sales.dn) === 0 && ve.retTax(ve.S.sales.dx) === 0 && ve.retTax(ve.S.sales.f) === 0, [ve.retTax(ve.S.sales.df), ve.retTax(ve.S.sales.dn)]);
  T('A28', 'La corrección no guarda nada nuevo en las ventas: el impuesto de la devolución se calcula al mostrar el informe', /const ivaT = r2\(sumF\(taxedS, x => taxIva\(x\.tax\)\) \+ sumF\(ss, retTax\)\)/.test(H) && !/doc:'devolucion'[^\n]*\btax:/.test(H)); }
T('A29', 'Vender: las categorías se eligen en una ventana (botón «Categoría» junto al buscador, con número de productos, buscador y «Sin categoría»), sin la barra que había que deslizar',
  /function posCatSheet\(\)\{/.test(H) && /class="catbtn" onclick="posCatSheet\(\)"/.test(H) && !/<div class="seg" id="posCats">/.test(H) && /ui\.posCat === POS_SIN \? !\(p\.cat \|\| ''\)\.trim\(\)/.test(H) && /Buscar categoría…/.test(H));
T('A30', 'Inventario, Clientes y Proveedores: los filtros se eligen en una ventana (botón «Mostrar» junto al buscador), sin barras que haya que deslizar',
  /function pickSheet\(title, groups, cur, setter\)\{/.test(H) && /function invPickSheet\(\)\{/.test(H) && /function fiPickSheet\(\)\{/.test(H) && /function prPickSheet\(\)\{/.test(H)
  && !/<div class="seg" id="invSeg">/.test(H) && !/<div class="seg" id="fiSeg">/.test(H) && /pickBtn\('invPickSheet'/.test(H) && /pickBtn\('fiPickSheet'/.test(H) && /pickBtn\('prPickSheet'/.test(H));
{ const errs = [...H.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m, i) => { try { new vm.Script(m[1]); return ''; } catch (e) { return 'bloque ' + i + ': ' + e.message; } }).filter(Boolean);
  T('A23', 'Todo el código de la app (web/index.html) es JavaScript válido: si no, la publicación falla al comprimirlo', !errs.length, errs); }
{ const a = H.indexOf('if (o.local && !STORE_ON()){'), sinTienda = a < 0 ? '' : H.slice(a, H.indexOf('return `${o.test', a));
  T('A24', 'Sin tienda en producción: solo se muestra con LIC_API o en pruebas; «Mi licencia» pide la licencia por correo (asunto «Solicitud de licencia StockSoft»), explica la clave tras verificar el pago y no tiene botones de compra',
    H.includes("const STORE_ON = () => !!(window.LIC_API || window.STOCKSOFT_ENV === 'pruebas');") && sinTienda.includes('Solicitud de licencia StockSoft') && sinTienda.includes('cuando verifiquemos el pago') && sinTienda.includes('renewSheet()') && !sinTienda.includes('buyLicense')); }
process.exit(end() ? 0 : 1);
