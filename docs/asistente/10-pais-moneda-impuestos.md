---
id: configuracion
roles: [administrador]
pantallas: [Ajustes del negocio, Configuración regional, Cambiar país del negocio, Impuestos, Datos del negocio, Documento por defecto al cobrar]
verificado: 2026-11-26 · rama pruebas 5c637a0
---
# País, moneda e impuestos

## Configuración regional
**Más → Ajustes del negocio → Configuración regional** muestra el país, la moneda, la zona horaria, el formato de números y fechas,
los impuestos, las formas de pago y si hay tasa BCV.
- **Países con configuración propia:** Venezuela, España, Estados Unidos, Colombia y México.
- **Otros países** (Perú, Chile, Argentina, Reino Unido, Portugal, Francia… 31 en total) usan su moneda real, pero **sin impuestos predefinidos**.
- **Otro país:** eliges la moneda.
- Los negocios creados antes de esta función están en **Venezuela** (botón **Confirmar Venezuela**). Nunca se cambia de país solo.

## Cambiar de país (paso a paso)
1. **Cambiar país** → elige el **Nuevo país** (y la **Zona horaria**).
2. Lee la **vista previa**: moneda, BCV, impuestos, formas de pago, número fiscal, productos en €…
3. **Revisar y cambiar** → confirma. Queda registrado quién y cuándo (**Historial de cambios** y registro de actividad).
- Las ventas, facturas y cobros anteriores **no cambian** y conservan su moneda.
- Los **precios no se convierten**: conservan su número. Revísalos.
- Tus **impuestos propios se conservan**.

## Impuestos
**Ajustes del negocio → Impuestos:**
- **Precios de venta:** **Incluyen impuestos** (el precio es el final; se separa base e impuesto) o **No incluyen impuestos** (se suman al cobrar).
  Por defecto: incluidos en España y Venezuela; sin incluir en EE. UU. Al cambiarlo se muestra un ejemplo real (p. ej. 1,20 € con IVA 21 %:
  incluidos → 1,20 €; sin incluir → 1,45 €). Los precios guardados y las ventas anteriores no cambian.
- **Lista de impuestos:** **+ Añadir impuesto** (nombre y porcentaje, por ejemplo IGV 18 %), **Editar**, **Eliminar**, **Impuesto por defecto de los productos nuevos**.
- Los tipos de cada país son **sugeridos y no validados oficialmente** (salvo los de siempre de Venezuela). **Volver a los sugeridos** restaura los del país.
- En países sin configuración, StockSoft **no asume ningún porcentaje**: se puede vender sin impuesto mientras se configuran.
- Cada venta guarda los impuestos con que se hizo: cambiarlos o borrarlos no altera ventas anteriores.

## Datos del negocio
Nombre, número fiscal (RIF, NIF, RFC, NIT…), teléfono, dirección, correo, **Logo del negocio** (y si sale en documentos),
**Próximo número de factura**, **Documento por defecto al cobrar**, **IGTF** (solo Venezuela), **Descuento máximo que puede dar un vendedor (%)**,
**Moneda por defecto de los precios nuevos** (solo Venezuela), **Aviso de stock bajo** y **Código de país (WhatsApp)**.

## Valores por país (resumen)
| País | Moneda | Impuestos sugeridos | Número fiscal |
|---|---|---|---|
| Venezuela | USD + Bs (BCV) | IVA 16 / 8 / exento (incluido) + IGTF 3 % opcional | RIF / cédula |
| España | EUR | IVA 21 / 10 / 4 (orientativo) | NIF |
| Estados Unidos | USD | ninguno (sales tax a configurar, se suma) | EIN / Tax ID |
| Colombia | COP (sin decimales) | IVA 19 / 5 (orientativo) | NIT |
| México | MXN | IVA 16 / 8 (orientativo) | RFC |
| Otros | Moneda del país | ninguno | Número fiscal |

## Disponible / Pendiente
- ✅ 37 países, cambio de país con vista previa e historial, impuestos propios, modalidad de precios, formatos por país.
- ⏳ Configuración fiscal validada oficialmente fuera de Venezuela; varios impuestos a la vez en una misma línea (p. ej. IVA + recargo).
