---
id: ayuda
roles: [administrador, vendedor]
pantallas: [Ayuda, Repetir el tutorial, Contactar con soporte, Ayuda y contacto]
verificado: 2026-11-26 · rama pruebas 5c637a0
---
# Centro de Ayuda y tutorial de bienvenida

## Centro de Ayuda
- Se abre con el botón **?** de arriba o en **Más → Ayuda**.
- **Buscador** (sin importar acentos), **categorías por módulo**, respuestas paso a paso y **Ir a la sección →** para abrir la pantalla correcta.
- **Repetir el tutorial** y **Contactar con soporte** (correo de soporte, ventas, WhatsApp y web).
- El vendedor solo ve las guías de lo que puede usar.
- Para desarrolladores: las guías están en el código como `HELP` y se exponen en `window.SSHelp` (artículos, categorías y búsqueda). Este archivo
  y el resto de `docs/asistente/` son la versión ampliada para el asistente.

## Tutorial de bienvenida
- Aparece **la primera vez** (negocio sin ventas o usuario creado hace menos de 7 días).
- Recorre: **Dashboard** (o **Inicio** para vendedores), **Vender**, **Inventario**, **Clientes**, **Proveedores**, **Caja**, **Reportes** y **Ayuda**,
  resaltando el botón real de cada sección.
- Botones **Anterior**, **Siguiente**, **Saltar tutorial**; indicador «n de 8»; también con el teclado (flechas y Esc). Funciona en PC, tablet y móvil.
- Al terminarlo o saltarlo no vuelve a salir (se recuerda por usuario en la nube y en el dispositivo). Se repite desde **Ayuda → Repetir el tutorial**.

## Disponible / Pendiente
- ✅ Centro de Ayuda con buscador y enlaces, tutorial guiado, contacto con soporte.
- ⏳ **StockSoft Assistant** (asistente inteligente): pendiente; esta base de conocimiento es su preparación.
