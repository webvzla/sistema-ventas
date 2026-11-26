// StockSoft Assistant: recuperación desde docs/asistente con las funciones reales de la app y límites de seguridad.
const fs = require('fs'), path = require('path'), vm = require('vm');
const { T, end } = require('./lib/t').suite('asistente');
const H = fs.readFileSync(path.join(__dirname, '..', 'web', 'index.html'), 'utf8');
const D = path.join(__dirname, '..', 'docs', 'asistente');
const cut = (a, b) => { const i = H.indexOf(a), j = H.indexOf(b, i); if (i < 0 || j < 0) throw new Error('no encontrado: ' + a); return H.slice(i, j); };
const block = cut('/* ============ StockSoft Assistant ============', '/* ============ Usuarios y contraseña ============ */');
const helpNorm = H.match(/const helpNorm = [^;]+;/)[0];
let fetched = [];
const ctx = { location: { protocol: 'https:' }, console, Set, Promise, JSON, Math, Date,
  fetch: async u => { const f = String(u).replace(/^asistente\//, ''); fetched.push(f); const p = path.join(D, f); return fs.existsSync(p) ? { ok: true, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')), text: async () => fs.readFileSync(p, 'utf8') } : { ok: false }; } };
vm.createContext(ctx);
vm.runInContext(helpNorm + '\n' + block.replace(/\bconst AS = /, 'var AS = ') + ';this.asRetrieve=asRetrieve;this.asGuide=asGuide;this.AS_SYS=AS_SYS;this.AS_LIM=AS_LIM;this.AS=AS;', ctx);

(async () => {
  const ask = async q => { fetched = []; const r = await ctx.asRetrieve(q); return { r, files: [...new Set(fetched)], txt: r.map(x => x.txt).join('\n') }; };
  const casos = [
    ['¿Cómo hago una nota de entrega?', '03-ventas-y-cobros.md', /Nota de entrega/],
    ['¿Cómo registro un abono de un cliente que me debe?', '06-clientes-y-fiados.md', /Registrar abono/],
    ['Quiero importar mi inventario desde Excel', '05-excel.md', /Importar desde Excel/],
    ['¿Cómo cierro la caja al final del día?', '08-caja-y-gastos.md', /Cerrar caja/],
    ['¿Cómo cambio los impuestos y el país?', '10-pais-moneda-impuestos.md', /Impuestos/],
    ['¿Cómo creo un usuario para mi empleado?', '12-usuarios-y-seguridad.md', /Nuevo usuario/]
  ];
  for (const [q, f, re] of casos) {
    const { r, files, txt } = await ask(q);
    T('AS-' + f.slice(0, 2), `«${q}» → recupera ${f} con la respuesta real y carga como mucho 5 guías (+ índice)`, r.length && r.some(x => x.f === f) && re.test(txt) && files.filter(x => x !== 'indice.json').length <= 5, { files, secciones: r.map(x => x.f + ' · ' + x.h) });
  }
  { const { r } = await ask('xyzzy plumbus'); T('AS-NO', 'Pregunta sin relación: no devuelve secciones (el asistente dirá que no lo encuentra)', r.length === 0, r.map(x => x.h)); }
  { const { r } = await ask('¿El asistente puede cambiar los precios de mis productos?'); T('AS-LIM', 'Preguntas sobre lo que no hace: llegan la guía del asistente o las limitaciones', r.some(x => /16-asistente|30-limitaciones/.test(x.f)), r.map(x => x.f)); }
  { const { r } = await ask('¿Cómo vendo?'); const len = r.reduce((a, x) => a + x.txt.length, 0); T('AS-TAM', 'Contexto acotado: como mucho 5 secciones y ~7.000 caracteres por pregunta', r.length <= 5 && len <= 7000, { n: r.length, len }); }
  { const q = '¿Cómo hago una nota de entrega?', { r } = await ask(q), g = ctx.asGuide(q, r);
    T('AS-GUIA', 'Modo guía: muestra las líneas que responden (la nota de entrega con su numeración NE-) y no títulos vacíos', /Nota de entrega/.test(g) && /NE-/.test(g) && g.split(/\n\n/).every(b => b.trim().split(/\n/).length > 1), g.slice(0, 400)); }
  const S = ctx.AS_SYS;
  T('AS-SYS', 'Instrucciones: solo documentación, decir "no lo encuentro" y soporte, solo informativo, sin credenciales, sin afirmar cumplimiento fiscal, idioma del usuario',
    /SOLO con la información de la DOCUMENTACIÓN/.test(S) && /No lo encuentro en la documentación/.test(S) && /solo informativo/.test(S) && /contraseñas, claves/.test(S) && /No afirmes que StockSoft cumple requisitos legales o fiscales/.test(S) && /idioma en que te escriben/.test(S));
  T('AS-RO', 'El asistente no tiene ninguna función que escriba datos del negocio (solo el contador assistUse)', !/\b(put|del|putCfg|saveProduct|checkout|makeNote)\(/.test(block) && (block.match(/\.set\(/g) || []).length === 1 && /collection\('assistUse'\)/.test(block));
  T('AS-PRIV', 'Al modelo no se le envían datos del negocio (ventas, clientes, productos, configuración)', !/S\.(sales|clients|products|suppliers|movs|cash)|cfg\.(name|rif|addr|phone|email)/.test(block.slice(block.indexOf('async function asSend'))));
  T('AS-KEY', 'Sin claves privadas: la configuración solo lleva enabled, model y appCheckKey (pública)', !/AIza|sk_|secret/i.test(block) && /window\.ASSISTANT/.test(block));
  T('AS-LIMS', 'Límites: 500 caracteres, 20/hora y 60/día por usuario, 300/día por negocio', ctx.AS_LIM.maxLen === 500 && ctx.AS_LIM.perHour === 20 && ctx.AS_LIM.perDay === 60 && ctx.AS_LIM.bizDay === 300);
  T('AS-UI', 'Interfaz: botón StockSoft Assistant, nueva conversación, indicador de escritura, mensaje inicial y vista móvil', /aria-label="StockSoft Assistant"/.test(H) && /Nueva conversación/.test(block) && /as-typing/.test(block) && /function asWelcome/.test(block) && /@media \(max-width:600px\)\{#assist/.test(H));
  { const cfgP = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'pruebas', 'firebase-config.js'), 'utf8'), prod = fs.readFileSync(path.join(__dirname, '..', 'web', 'firebase-config.js'), 'utf8');
    T('AS-OFF', 'Gemini apagado (pendiente de autorización y financiación): enabled:false en pruebas y sin configuración en producción', /window\.ASSISTANT = \{ enabled: false/.test(cfgP) && !/ASSISTANT/.test(prod) && /autorización y financiación/.test(cfgP)); }
  T('AS-SUG', 'Preguntas sugeridas en el modo guía (sin coste)', /const AS_SUG = \[/.test(H) && /Preguntas sugeridas/.test(H) && /function asAsk/.test(H));
  process.exit(end() ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
