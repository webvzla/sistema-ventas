---
id: inventario
roles: [administrador, vendedor]
pantallas: [Inventario, Reponer stock, Ajustar precios, Imprimir etiquetas, Revisar repetidos, Pedido sugerido, Vencimientos por lote (opcional)]
verificado: 2026-11-26 · rama pruebas 5c637a0
---
# Productos e inventario

## Añadir o editar un producto (administrador)
**Inventario → + Producto** (o toca un producto para editarlo). Campos:
- **Nombre**, **Foto (opcional)**, **Categoría**, **Marca / modelo**.
- **Precio de venta** y **Costo**. La etiqueta indica si el precio va **con impuestos** o **sin impuestos** según la modalidad del negocio,
  y debajo se ve la **ganancia por unidad** y el **precio final** (o la base) con el impuesto.
- En Venezuela: **Precio en** **Dólares ($ BCV)** o **Euros (€ BCV)**. En otros países los precios van en la moneda del negocio.
- **Precio al mayor (opcional)** y **A partir de (cantidad)**: desde esa cantidad cada unidad se cobra al precio al mayor.
- **Código de barras**: escanéalo, escríbelo o **Generar código nuevo**; se ve el dibujo del código.
- **Se vende por** (unidad, kg, g, lt, paquete, caja), **Garantía**, **Proveedor habitual**.
- **Impuesto**: los del negocio o **Sin impuesto** (si un producto tenía un impuesto que ya no existe, se conserva como «valor anterior»).
- **Stock actual**, **Avisar cuando queden**, **Controlar stock de este producto**.
- **Vencimientos por lote (opcional)**: fecha y cantidad de cada lote; lo vendido sale primero del lote que vence antes.
- Al editar: **+ Reponer stock**, **Etiqueta**, **WhatsApp** (envía la ficha del producto).

## Menú de opciones del inventario
- **Importar desde Excel** y **Deshacer última importación** (ver `05-excel.md`).
- **Ajustar precios en bloque**: sube o baja un % a todos o a una categoría, con redondeo (céntimo, 0,05… o 1, 10, 100 en monedas sin decimales) y opción de aplicarlo al costo.
- **Imprimir etiquetas**: con precio y código de barras (en Venezuela, opcionalmente con el precio en Bs).
- **Exportar inventario a Excel** (CSV).

## Reponer stock
Producto → **+ Reponer stock**: **Cantidad que llegó**, **Fecha de vencimiento de este lote (opcional)** y **Nuevo costo** (opcional). También sube el stock al registrar una compra a un proveedor.

## Avisos e inventario inteligente
- Pastillas **Agotado** / **Bajo** y avisos de **vencidos** o que **vencen pronto**.
- **Pedido sugerido**: calcula cuánto comprar según lo que se vende (agrupado por proveedor) y permite enviarlo por WhatsApp. Se abre desde el aviso «Ver pedido sugerido →».
- **Revisar repetidos**: detecta **productos con el mismo nombre** y **categorías escritas de varias formas** y permite unificarlas.
- Opciones en **Más → Ajustes del negocio → Inventario inteligente** (ver `14-datos-respaldo-y-app.md`).

## Lo que puede hacer el vendedor
Ver productos, precios y stock (sin costos). Al tocar un producto ve su ficha de precio. No puede crear, editar ni borrar productos.

## Preguntas frecuentes
- **¿Cómo pongo códigos a productos que no traen?** **Generar código nuevo** en la ficha e imprime la etiqueta.
- **¿Puedo vender por kilos?** Sí: «Se vende por» kg o g y escribe la cantidad con decimales en el carrito.
- **¿Qué pasa con el precio si cambio de país?** No se convierte solo: conserva su número. Revisa los precios después.

## Disponible / Pendiente
- ✅ Productos con foto, código, categoría, costo, precio al mayor, impuesto, lotes y vencimientos, reponer, etiquetas, ajuste en bloque, repetidos, pedido sugerido.
- ⏳ Kárdex por producto (historial de entradas y salidas), variantes (tallas/colores), varios almacenes, combos o kits.
