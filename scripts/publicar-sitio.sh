#!/usr/bin/env bash
# Arma public/ listo para Firebase Hosting:
#  1) la página de presentación en la raíz y la app en /app/ (build-site.sh),
#  2) el código de la app comprimido y ofuscado (minify.js),
#  3) el instalador de Windows y latest.yml de la última versión en /updates/
#     (de ahí descarga la app de PC sus actualizaciones; el repositorio puede ser privado).
# Necesita GH_TOKEN y GITHUB_REPOSITORY (los da GitHub Actions).
set -e
bash scripts/build-site.sh
node scripts/minify.js public/app/index.html public/index.html
mkdir -p public/updates
gh release download --repo "$GITHUB_REPOSITORY" --pattern 'latest.yml' --pattern '*.exe' --pattern '*.blockmap' --dir public/updates --clobber
ls -la public/updates
