# Base de conocimiento de StockSoft (fuente de StockSoft Assistant)

Esta carpeta explica **cómo funciona StockSoft de verdad**, módulo por módulo, en lenguaje sencillo para comerciantes.
Es la fuente de **StockSoft Assistant**: la app publica esta carpeta en `/app/asistente/` y el asistente lee solo las guías que necesita. Al cambiar una guía y publicar, el asistente usa la versión nueva. Hoy funciona en **modo guía** (sin IA ni coste); la IA con Gemini está preparada y pendiente de autorización y financiación.

## Cómo está organizada
| Archivo | Tema |
|---|---|
| `01-primeros-pasos.md` | Crear la cuenta, prueba gratis, primeros ajustes, pantallas principales |
| `02-dashboard-e-inicio.md` | Dashboard (administrador) e Inicio (vendedor) |
| `03-ventas-y-cobros.md` | Vender, documentos, pagos, descuentos, fiado, correcciones, devoluciones, cotizaciones |
| `04-productos-e-inventario.md` | Productos, stock, lotes y vencimientos, precio al mayor, etiquetas, repetidos, pedido sugerido |
| `05-excel.md` | Importar y exportar con Excel |
| `06-clientes-y-fiados.md` | Clientes, fiados, abonos, descuentos por cliente |
| `07-proveedores-y-compras.md` | Proveedores, compras, pagos y pedidos |
| `08-caja-y-gastos.md` | Abrir y cerrar caja, gastos y pagos fijos |
| `09-reportes.md` | Reportes y estadísticas |
| `10-pais-moneda-impuestos.md` | Configuración regional, monedas, impuestos y modalidad de precios |
| `11-tasa-bcv-venezuela.md` | Tasa BCV (solo negocios de Venezuela) |
| `12-usuarios-y-seguridad.md` | Usuarios, roles, permisos, contraseñas, registro de actividad |
| `13-licencias.md` | Prueba gratis, licencia, códigos, tienda de licencias |
| `14-datos-respaldo-y-app.md` | Copias de seguridad, exportar, uso sin internet, app de PC, actualizaciones, avisos |
| `15-ayuda-y-tutorial.md` | Centro de Ayuda y tutorial de bienvenida |
| `16-asistente.md` | StockSoft Assistant: qué hace, de dónde saca las respuestas y sus límites |
| `20-problemas-frecuentes.md` | Problemas habituales y cómo resolverlos |
| `30-limitaciones-y-pendiente.md` | Lo que StockSoft todavía NO hace o está pendiente |
| `indice.json` | Índice para máquinas: módulos, archivos, roles, pantallas y palabras clave |

Cada archivo empieza con una ficha (`id`, `roles`, `pantallas`, `verificado`) y usa siempre la misma estructura:
**Qué es → Dónde está → Paso a paso → Preguntas frecuentes → Diferencias por país → Disponible / Pendiente**.

## Reglas para mantenerla
1. **Solo lo que existe.** Todo sale del código real (`web/index.html`, `web/regiones.js`, `web/precios.js`, `functions/`). Si algo no está, va en «Pendiente».
2. **Separar siempre** «✅ Disponible» de «⏳ Pendiente / no disponible».
3. **Cuando cambie una función**, actualizar el archivo del módulo y la fecha y el commit de `verificado`. La prueba `tests/docs.test.js` comprueba que los nombres de pantallas citados en `indice.json` siguen existiendo en la app: si se renombra un botón, la prueba falla hasta corregir la documentación.
4. **Nada privado:** sin claves, contraseñas, correos de clientes, datos de negocios ni credenciales.
5. **Lenguaje sencillo:** frases cortas, nombres de botones tal como aparecen en pantalla (en **negrita**).
6. **Roles:** indicar si algo es solo para el **administrador** o también para el **vendedor**.

## Glosario rápido
- **Administrador:** puede hacer todo. **Vendedor:** vende y cobra, sin cambiar precios, ajustes ni ver ganancias.
- **Moneda base:** la moneda en que se guardan los precios del negocio ($ en Venezuela y EE. UU., € en España, COP en Colombia…).
- **Fiado:** venta a crédito a un cliente; luego se registran sus **abonos**.
- **Documento de control interno:** los documentos de StockSoft no sustituyen a la facturación legal de cada país.
