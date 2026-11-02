#!/usr/bin/env bash
# Arma public/ listo para Firebase Hosting: la página de presentación en la raíz y la app en /app/
# (build-site.sh) y el código de la app comprimido y ofuscado (minify.js).
# (El instalador de Windows no puede ir aquí: el plan gratuito de Firebase no admite archivos .exe.)
set -e
bash scripts/build-site.sh
node scripts/minify.js public/app/index.html public/index.html
