#!/usr/bin/env bash
# Arma el sitio de stocksoft.web.app: la presentación en la raíz y la app en /app/.
set -e
rm -rf public && mkdir -p public/app
cp -r web/. public/app/
rm -rf public/app/descargar
cp web/descargar/index.html public/index.html
cp web/descargar/app-vender.png web/icon.png public/
sed -i 's#\.\./icon\.png#icon.png#g; s#https://stocksoft\.web\.app/app/"#/app/"#g' public/index.html
echo "Sitio listo en public/"
