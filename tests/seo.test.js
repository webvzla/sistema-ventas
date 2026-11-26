// Sitio público: el sitemap y los enlaces internos apuntan a URL finales (sin redirecciones) y cada página tiene canonical.
const fs = require('fs'), path = require('path');
const { T, end } = require('./lib/t').suite('seo');
const R = path.join(__dirname, '..'), rd = p => fs.readFileSync(path.join(R, p), 'utf8');
const walk = d => fs.readdirSync(path.join(R, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : /\.html$/.test(e.name) ? [d + '/' + e.name] : []);
const pub = ['web/descargar/index.html', ...walk('web/herramientas'), ...walk('web/sitio')];
const locs = [...rd('web/raiz/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
// Con cleanUrls de Firebase, "x.html" e "index.html" redirigen (301) a la URL limpia.
T('SEO-1', 'El sitemap solo lista URL finales de https://stocksoft.app (sin .html, index.html ni www/http)', locs.length > 10 && locs.every(u => /^https:\/\/stocksoft\.app\//.test(u) && !/\.html$/.test(u)), locs.filter(u => /\.html$/.test(u) || !/^https:\/\/stocksoft\.app\//.test(u)));
const malos = pub.flatMap(f => [...rd(f).matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(h => /^(\/|https?:\/\/(www\.)?stocksoft\.app)/.test(h) && (/\.html(#|$)/.test(h) || /^http:|www\.stocksoft/.test(h))).map(h => f + ' → ' + h));
T('SEO-2', 'Los enlaces internos del sitio público no apuntan a URL que redirigen (.html, http, www)', !malos.length, malos.slice(0, 10));
const sinCan = [...pub, 'web/legal/privacidad.html', 'web/legal/terminos.html'].filter(f => !/<link rel="canonical" href="https:\/\/stocksoft\.app\/[^"]*"/.test(rd(f)));
T('SEO-3', 'Todas las páginas públicas, incluidas privacidad y términos, tienen canonical a stocksoft.app', !sinCan.length, sinCan);
T('SEO-4', 'El sitemap del generador (sitio.mjs) usa las URL limpias de las páginas legales', /'app\/legal\/privacidad'/.test(rd('scripts/sitio.mjs')) && !/legal\/[a-z]+\.html/.test(rd('scripts/sitio.mjs')));
process.exit(end() ? 0 : 1);
