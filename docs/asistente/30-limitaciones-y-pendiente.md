---
id: limitaciones
roles: [administrador, vendedor]
pantallas: []
verificado: 2026-11-26 · rama pruebas 5c637a0
---
# Limitaciones conocidas y funciones que StockSoft todavía NO ofrece

El asistente debe responder con honestidad: «StockSoft todavía no lo hace» y, si existe, ofrecer la alternativa.

## Facturación y fiscalidad
- ❌ No es facturación electrónica oficial (no hay Verifactu ni TicketBAI en España, CFDI en México, DIAN en Colombia, ni conexión con máquinas fiscales).
  **Alternativa:** los documentos son de control interno; la factura legal la emite el sistema autorizado.
- ❌ Configuración fiscal validada fuera de Venezuela: los impuestos de ES, CO y MX son sugeridos; EE. UU. y otros países se configuran a mano.
- ❌ Series de numeración por año o por caja (hay una numeración por tipo de documento por negocio).
- ❌ Varios impuestos en una misma línea (por ejemplo IVA + recargo de equivalencia).

## Ventas e inventario
- ❌ Apartados con abonos, combos o kits, variantes (talla/color), varios almacenes, kárdex por producto.
- ❌ Más formas de pago integradas (Cashea, Biopago, cobro con tarjeta desde la app).
- ❌ Impresión directa en impresoras térmicas (se genera el PDF de 80 mm para imprimir).

## Cuentas y licencias
- ❌ Varias empresas en una misma cuenta (una cuenta = un negocio).
- ❌ Pago de la licencia en línea en la versión publicada (solo en pruebas); renovación automática; precios fuera de Venezuela.
- ❌ Roles personalizados o verificación en dos pasos.

## Datos
- ❌ Copias automáticas en la nube para la versión web (son manuales; en el PC son diarias).
- ❌ «Deshacer importación» desde otro dispositivo o de importaciones anteriores a la última.
- ❌ Reportes con rango de fechas libre o en PDF.

## Asistencia
- ⏳ StockSoft Assistant con IA (Gemini): preparado pero pendiente de activar; hoy responde en **modo guía** con estas mismas guías.
- ❌ El asistente no hace cambios ni consulta datos del negocio (es solo informativo).

## Diferencias entre entorno de pruebas y versión publicada
Las funciones de internacionalización, tienda de licencias, documentos por país, modalidad de precios, tutorial y Ayuda están en la
**versión de pruebas** y llegarán a la versión publicada cuando se autorice el lanzamiento.
