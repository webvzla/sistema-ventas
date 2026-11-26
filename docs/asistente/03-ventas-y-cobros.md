---
id: ventas
roles: [administrador, vendedor]
pantallas: [Vender, Escanear código, Servicio o artículo libre, Documento, Forma de pago, Cambiar forma de pago, Devolver productos, Cotizaciones]
verificado: 2026-11-26 · rama pruebas 5c637a0
---
# Ventas y cobros

## Registrar una venta (paso a paso)
1. Entra en **Vender**. Si la caja está cerrada verás «La caja está cerrada» con el botón **Abrir caja** (puedes vender igual).
2. Añade productos: **busca por nombre o código**, toca el producto, usa un lector de códigos o **Escanear** con la cámara.
   Para algo que no está en el inventario (un servicio, un envío): **+ Servicio o artículo libre** (descripción, cantidad, precio e impuesto).
3. En el **Carrito** ajusta cantidades con − / +. Cada línea muestra su impuesto en una etiqueta: **tócala para cambiarlo**
   (por ejemplo, de IVA 16 % a 8 % o sin IVA). Botones **Quitar … a todo** y **Volver a ponerlos como en el inventario**.
4. Si un producto tiene **precio al mayor** y llegas a su cantidad mínima («A partir de»), ese precio se aplica solo a toda la línea.
5. **Cliente:** elige uno para aplicar su **descuento fijo** o para venderle **fiado**.
6. **Descuento:** en % o en importe. El vendedor tiene un **máximo** (lo pone el administrador en Ajustes).
7. **Documento:** elige el tipo (ver abajo).
8. Revisa el **total**: si hay impuestos se ve la **base imponible, el impuesto y el total** antes de cobrar.
9. **Forma de pago:** **Un solo pago** (con «Recibido» para calcular el vuelto) o **Pago mixto** (varios pagos hasta cubrir el total).
10. Pulsa **Cobrar**. Se descuenta el stock, se registra el pago y aparece el detalle de la venta con sus opciones.

## Documentos al cobrar
**Venezuela:** **Factura fiscal** (pide cédula/RIF y nombre; botón **Consumidor final**) y **Nota de entrega (sin factura)**.
**Resto de países:**
- **Venta sin documento:** no pide datos del comprador. La venta se registra igual (inventario, pago, caja, impuestos, informes).
- **Factura simplificada** (España) / **Ticket simplificado** (otros): sin datos del cliente, con numeración propia **FS-000001, FS-000002…**
  En España, si pasa de 400 € aparece un aviso orientativo para hacer factura completa.
- **Factura completa:** pide el **número fiscal real** del cliente (se comprueba: en España DNI, NIE o CIF con su letra o dígito de control;
  en México RFC; en Colombia NIT), el **nombre** y, en España, la **dirección**. No se aceptan números de relleno como V00000000.
- El documento por defecto se elige en **Más → Ajustes del negocio → Documento por defecto al cobrar**.
- Los documentos son de **control interno**: no sustituyen a la facturación legal del país (máquina fiscal, Verifactu, CFDI, DIAN…).

## Después de cobrar (detalle de la venta)
- **Ver factura / Ver nota de entrega / Ver factura simplificada**: documento tamaño carta con **Descargar PDF** y, para nota o simplificada, **Ticket 80 mm**.
- **Enviar recibo por WhatsApp**.
- En facturas de Venezuela se puede escribir el **número de factura** de la máquina fiscal o talonario; las siguientes siguen desde ahí.
- **¿Hubo un error? (solo administrador):** **Corregir venta**, **Cambiar forma de pago**, **Devolver productos**, **Anular**.

## Devoluciones
1. Abre la venta → **Devolver productos**.
2. Indica cuántas unidades de cada producto vuelven y **Cómo se devuelve el dinero** (efectivo, transferencia… o descontarlo del fiado del cliente).
3. Se registra una **Devolución** (en negativo), vuelve el stock y se descuenta de los informes.

## Cotizaciones (presupuestos)
1. En **Vender**, añade los productos y pulsa **Cotización**.
2. Datos del cliente (nombre, teléfono, número fiscal opcional), **Válida por (días)** y una nota.
3. Se guarda en **Más → Cotizaciones** (Abiertas, Vendidas, Vencidas). Desde ahí: **PDF**, **WhatsApp**, **Editar cotización** o **Convertir en venta** (y luego **Ver la venta**).

## Preguntas frecuentes
- **¿Puedo vender sin abrir la caja?** Sí, pero el cierre de caja solo cuenta lo vendido con la caja abierta.
- **El cliente no quiere factura, ¿la venta cuenta?** Sí. Usa **Venta sin documento** o **Factura simplificada**; la operación queda registrada con sus impuestos.
- **¿Cómo cobro parte en efectivo y parte con tarjeta?** **Pago mixto**.
- **¿Puedo cambiar el precio en la venta?** El precio sale del inventario. Se puede cambiar el impuesto de la línea o aplicar un descuento; para otro precio, edita el producto (administrador) o usa **artículo libre**.
- **¿Qué pasa si vendo un producto sin stock?** Se avisa («figura agotado») pero se puede vender; el stock queda en negativo.

## Diferencias por país
- Formas de pago de Venezuela: efectivo $, efectivo Bs, pago móvil, punto de venta, transferencia, Zelle, efectivo €, fiado (IGTF 3 % opcional en divisas).
- España: efectivo, tarjeta, Bizum, transferencia, fiado. EE. UU.: efectivo, tarjeta, Zelle, cheque, transferencia, fiado.
  Colombia: efectivo, tarjeta, Nequi, Daviplata, transferencia, fiado. México: efectivo, tarjeta, transferencia SPEI, fiado. Otros: efectivo, tarjeta, transferencia, fiado.

## Disponible / Pendiente
- ✅ Venta con escáner o cámara, artículo libre, impuesto por línea, precio al mayor, descuentos, pago mixto, fiado, documentos por país, PDF, ticket 80 mm, WhatsApp, correcciones, devoluciones, cotizaciones.
- ⏳ Conexión con impresoras o máquinas fiscales, facturación electrónica oficial (Verifactu, CFDI, DIAN), series de numeración por caja o por año, apartados con abonos.
