# StockSoft

Inventario, ventas con escáner de códigos de barras, factura fiscal o nota de entrega, clientes y fiados, proveedores y compras, gastos, dashboard con gráficos y tasas BCV (dólar y euro).

Funciona de dos formas con el mismo código:

- **Programa de Windows (.exe)**: lee la tasa directamente de bcv.org.ve cuando hay internet y guarda una copia de seguridad diaria en una carpeta del ordenador.
- **Versión web para el móvil**: se abre desde el navegador y se puede instalar como app ("Añadir a pantalla de inicio").

Con la nube (Firebase) activada, el PC y los móviles comparten los mismos datos en tiempo real, y se puede seguir vendiendo sin internet: todo se sincroniza al volver la conexión.

## Estructura

| Carpeta | Qué hay |
|---|---|
| `web/` | La aplicación (index.html), configuración de la nube, manifiesto e iconos |
| `electron/` | El programa de escritorio: tasa BCV, copias de seguridad, guardar archivos |
| `firestore.rules` | Reglas de seguridad de la base de datos (permisos de administrador y vendedor) |
| `.github/workflows/` | Construye el .exe y publica la versión web automáticamente |

## Activar la nube

1. Crea un proyecto en [Firebase](https://console.firebase.google.com) y activa **Authentication → Correo/contraseña** y **Firestore Database**.
2. Pega el bloque `firebaseConfig` de tu app web en `web/firebase-config.js`.
3. En Firestore → **Reglas**, pega el contenido de `firestore.rules` y pulsa **Publicar**.

Sin este paso el sistema funciona igual, pero los datos se quedan solo en ese dispositivo.

## Publicar (en dos pasos)

1. **Pruebas**: subir a la rama `pruebas` publica en la vista previa
   https://stocksoft--pruebas-hx0q1cm0.web.app/app/ (los clientes no la ven).
2. **Real**: tras aprobarlo, pasar a `main` publica https://stocksoft.web.app con el código ofuscado.
   La app de PC carga esta web desde internet, así que los cambios llegan sin aviso de actualización.
3. **Instalador de Windows**: solo se genera si cambian `electron/`, `package.json` o `build/`
   (o lanzando a mano "Instalador de Windows"). Se guarda como release del repositorio y se publica en
   https://stocksoft.web.app/updates/, de donde la app descarga sus actualizaciones.

`scripts/publicar-sitio.sh` arma `public/`: página en la raíz, app en `/app/`, código ofuscado
(`scripts/minify.js`) e instalador en `/updates/`. Las reglas de Firestore se publican a mano en la consola.

En un ordenador propio (requiere Node.js 20):

```
npm install
npm start      # abrir el programa
npm run dist   # generar el instalador en dist/
```

## Roles

- **Administrador**: todo (inventario, precios, costos, proveedores, gastos, reportes, usuarios, ajustes).
- **Vendedor**: vender, consultar precios y tasas, ver inventario y cobrar a clientes. Con la nube activada, las reglas de Firestore impiden en el servidor que modifique productos, precios, proveedores, gastos o usuarios.

## Licencia

© 2026 StockSoft. Todos los derechos reservados. Software propietario: ver [LICENSE](LICENSE).
