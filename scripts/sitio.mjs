// Genera las páginas públicas de contenido (guías, quiénes somos, contacto) de stocksoft.app.
// Fuente: scripts/sitio/*.html (cada uno empieza con un bloque <!--meta ... --> y sigue con el cuerpo en HTML).
// Salida: web/sitio/<ruta>/index.html (build-site.sh lo copia a la raíz del sitio).
// Uso: node scripts/sitio.mjs     · © 2026 StockSoft. Todos los derechos reservados.
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'scripts/sitio', OUT = 'web/sitio', SITE = 'https://stocksoft.app';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '');
const fecha = iso => new Date(iso + 'T12:00:00').toLocaleDateString('es-VE', {day:'numeric', month:'long', year:'numeric'});

export const NAV = `<header class="top"><div class="wrap">
  <a class="brand" href="/"><img src="/icon.png?v=2" alt=""><b>STOCK<span>SOFT</span></b></a>
  <nav class="nav"><a class="hide-m" href="/guias/">Guías</a><a class="hide-m" href="/herramientas/">Utilidades gratis</a><a class="hide-m" href="/">Programa de ventas</a><a class="btn sm" href="/app/">Probar gratis</a></nav>
</div></header>`;
export const FOOTER = `<footer><div class="wrap"><span>© <span id="year">2026</span> StockSoft. Todos los derechos reservados.</span><span><a href="/guias/">Guías</a> · <a href="/herramientas/">Utilidades gratis</a> · <a href="/quienes-somos/">Quiénes somos</a> · <a href="/contacto/">Contacto</a> · <a href="/app/legal/terminos">Términos</a> · <a href="/app/legal/privacidad">Privacidad</a></span></div></footer>`;

function parse(file){
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^<!--meta\s*([\s\S]*?)-->\s*([\s\S]*)$/);
  if (!m) throw new Error('Falta el bloque <!--meta--> en ' + file);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)){ const i = line.indexOf(':'); if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  for (const k of ['title', 'desc', 'path', 'h1']) if (!meta[k]) throw new Error(`Falta "${k}" en ${file}`);
  return {...meta, body:m[2].trim(), file};
}

function page(p, extra = ''){
  const url = SITE + '/' + p.path;
  const words = strip(p.body).split(/\s+/).filter(Boolean).length, mins = Math.max(2, Math.round(words / 200));
  const related = (p.related || '').split(';').map(x => x.trim()).filter(Boolean).map(x => { const [href, label] = x.split('|').map(s => s.trim()); return `<a href="${href}">${label}</a>`; });
  const isGuide = p.path.startsWith('guias/') && p.path !== 'guias/';
  const ld = isGuide ? `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org', '@type':'Article', headline:strip(p.h1), description:p.desc, inLanguage:'es-VE', datePublished:p.date, dateModified:p.updated || p.date, author:{'@type':'Organization', name:'StockSoft'}, publisher:{'@type':'Organization', name:'StockSoft', logo:{'@type':'ImageObject', url:SITE + '/icon.png'}}, mainEntityOfPage:url})}</script>` : '';
  return `<!DOCTYPE html>
<!-- StockSoft · © 2026 StockSoft. Todos los derechos reservados. Generado por scripts/sitio.mjs: no editar a mano. -->
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${isGuide ? 'article' : 'website'}">
<meta property="og:title" content="${esc(p.og || p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${url}">
<meta name="google-adsense-account" content="ca-pub-9769351537955799">
${p.noads ? '' : '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9769351537955799" crossorigin="anonymous"></script>\n'}<meta name="theme-color" content="#060d1d">
<link rel="icon" href="/icon.png?v=2">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/herramientas/estilo.css">
${ld}
</head>
<body>
${NAV}

<main class="wrap">
  <section class="hero">
    <div class="crumb"><a href="/">Inicio</a>${p.crumb ? ' › ' + p.crumb : ''}</div>
    <h1>${p.h1}</h1>
    ${p.lead ? `<p class="lead">${p.lead}</p>` : ''}
    ${isGuide ? `<p class="byline">Por el equipo de StockSoft · Actualizado el ${fecha(p.updated || p.date)} · ${mins} min de lectura</p>` : ''}
  </section>
  <div class="layout">
    <article class="info prose">
${p.body}
${extra}
${isGuide ? `<div class="ad" data-slot=""></div>
<p class="mut disclaimer">Esta guía es información general para comercios y no sustituye la asesoría de un contador. Las normas fiscales y de precios pueden cambiar; verifica siempre la normativa vigente del SENIAT, el BCV y la SUNDDE.</p>` : ''}
    </article>
    <aside class="side">
      ${related.length ? `<div class="promo"><b>Úsalo ahora</b><p>${related.join('<br>')}</p></div>` : ''}
      <div class="promo"><b>Todo esto, solo en cada venta</b><p>StockSoft lleva inventario, ventas, IVA, caja y fiados con la tasa BCV del día.</p><a class="btn" href="/app/">Probar gratis 7 días</a></div>
      ${p.noads ? '' : '<div class="ad" data-slot=""></div>'}
    </aside>
  </div>
</main>

${FOOTER}
<script src="/herramientas/comun.js"></script>
</body>
</html>
`;
}

const pages = fs.readdirSync(SRC).filter(f => f.endsWith('.html')).sort().map(f => parse(path.join(SRC, f)));
const guides = pages.filter(p => p.path.startsWith('guias/') && p.path !== 'guias/').sort((a, b) => (+a.order || 99) - (+b.order || 99));
fs.rmSync(OUT, {recursive:true, force:true});
for (const p of pages){
  const extra = p.path === 'guias/' ? `<div class="guide-list">${guides.map(g => `<a class="guide-card" href="/${g.path}"><b>${strip(g.h1)}</b><p>${esc(g.desc)}</p><span>Leer guía →</span></a>`).join('\n')}</div>` : '';
  const dir = path.join(OUT, p.path); fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir, 'index.html'), page(p, extra));
}
// Sitemap: páginas principales + utilidades + guías.
const urls = [['', 'weekly', '1.0'], ['herramientas/', 'weekly', '0.9'], ['herramientas/dolar-bcv/', 'daily', '0.9'], ['herramientas/precio-en-bolivares/', 'daily', '0.8'], ['herramientas/iva-igtf/', 'monthly', '0.8'], ['herramientas/margen-ganancia/', 'monthly', '0.7'], ['herramientas/codigo-de-barras/', 'monthly', '0.7'],
  ['guias/', 'weekly', '0.9'], ...guides.map(g => [g.path, 'monthly', '0.8']), ['quienes-somos/', 'yearly', '0.5'], ['contacto/', 'yearly', '0.5'], ['app/legal/privacidad', 'yearly', '0.3'], ['app/legal/terminos', 'yearly', '0.3']];
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync('web/raiz/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, f, pr]) => `  <url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log(`${pages.length} páginas generadas en ${OUT} (${guides.length} guías) y sitemap con ${urls.length} URL.`);
