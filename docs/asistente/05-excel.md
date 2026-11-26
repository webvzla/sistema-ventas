---
id: excel
roles: [administrador]
pantallas: [Importar desde Excel, Deshacer última importación, Exportar inventario a Excel, Respaldo y exportar]
verificado: 2026-11-26 · rama pruebas 5c637a0
---
# Importar y exportar con Excel

## Importar productos desde Excel, hoja de cálculo o CSV (paso a paso)
1. **Inventario → menú de opciones → Importar desde Excel** y elige el archivo (**.xlsx, .xls o .csv**). Hay una plantilla de ejemplo.
2. StockSoft lo lee solo: encuentra la **fila de títulos** aunque no sea la primera, entiende **nombres de columna distintos**
   (precio, PVP, costo, existencia…), ignora filas de **totales** y avisa de números dudosos.
3. **1. Así entendí tu archivo:** revisa qué columna es cada dato y cámbiala si hace falta (también la **Hoja**).
4. **2. Confirma estos datos:** según el archivo, te pregunta:
   - En qué **moneda** están los precios (en Venezuela: dólares, euros o bolívares con la **tasa** para convertir; fuera de Venezuela siempre la moneda del negocio).
   - El **impuesto** de los productos nuevos que no lo indican y si **los precios del archivo ya incluyen el impuesto**.
   - Qué hacer con el **stock** de los productos que ya tienes (poner el del archivo, sumarlo o no cambiarlo).
   - **Categoría** para los nuevos y si **crear proveedores** nuevos.
5. Revisa la **vista previa** (nuevo / cambia) y los **conflictos** (mismo código con otro nombre, etc.) y pulsa **Importar**.
6. Solo se cambian los datos que trae el archivo; el resto del producto se respeta.

## Deshacer
**Deshacer última importación** devuelve los productos como estaban (respeta las ventas posteriores) y borra los creados.
También puedes **Descargar copia de seguridad** con los datos anteriores. Solo funciona en el mismo navegador o PC y para la última importación.

## Exportar
- **Inventario → Exportar inventario a Excel** (CSV con moneda, precio, costo, stock, unidad, mínimo, garantía; en Venezuela también el precio en Bs).
- **Más → Respaldo y exportar → Exportar a Excel:** **Inventario**, **Ventas** (fecha, documento, número, cliente, productos, impuestos, total, forma de pago, vendedor, moneda) y **Fiados**.

## Preguntas frecuentes
- **Mi Excel tiene los precios en bolívares** (Venezuela): elige «Bolívares → pasar a $» y revisa la tasa que propone (la del archivo o la BCV guardada).
- **¿Duplica productos si importo dos veces?** No: reconoce los productos por código y por nombre; lo que no cambia no se escribe.
- **¿Puede el vendedor importar?** No, solo el administrador.

## Disponible / Pendiente
- ✅ Importación inteligente con vista previa, conflictos, lotes de hasta 400 operaciones, deshacer y copia; exportaciones CSV.
- ⏳ Importar clientes o proveedores desde Excel; exportar directamente en formato .xlsx (hoy es CSV, que abre Excel).
