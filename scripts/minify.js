// Comprime y ofusca el código de la app publicada (public/) para que no se pueda leer ni copiar
// con facilidad. Se ejecuta después de build-site.sh; el código original queda solo en el repositorio.
// Las funciones globales conservan su nombre porque los botones las llaman desde el HTML (onclick).
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const AVISO = '/* © 2026 StockSoft. Todos los derechos reservados. Software propietario: prohibida su copia, modificación o distribución. */';
const files = process.argv.slice(2);
if (!files.length) { console.error('Uso: node scripts/minify.js public/app/index.html …'); process.exit(1); }

(async () => {
  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)];
    let antes = 0, despues = 0;
    for (const m of scripts) {
      const code = m[2];
      if (!code.trim()) continue;
      const out = await minify(code, {
        compress: { passes: 2 },
        mangle: true,
        format: { comments: false, preamble: AVISO }
      });
      if (out.code == null) throw new Error('No se pudo comprimir un script de ' + file);
      antes += code.length; despues += out.code.length;
      html = html.replace(m[0], () => `<script${m[1]}>${out.code}</script>`);
    }
    // Quita comentarios HTML (deja el aviso de copyright) y espacios sobrantes entre etiquetas.
    html = html.replace(/<!--(?![\s\S]*?derechos reservados)[\s\S]*?-->/g, '').replace(/>\s+</g, '><');
    fs.writeFileSync(file, html);
    console.log(`✓ ${path.relative(process.cwd(), file)}: JS ${Math.round(antes / 1024)} KB → ${Math.round(despues / 1024)} KB`);
  }
})().catch(e => { console.error('✗', e.message); process.exit(1); });
