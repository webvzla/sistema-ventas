---
id: clientes
roles: [administrador, vendedor]
pantallas: [Clientes, + Nuevo cliente, Tipo de cliente, Descuento fijo (%), Cliente del fiado]
verificado: 2026-11-26 · rama pruebas 5c637a0
---
# Clientes y fiados

## Registrar un cliente
**Clientes → + Nuevo cliente**: **Nombre**, número fiscal (Cédula/RIF en Venezuela, NIF en España…), **Teléfono (WhatsApp)**, dirección,
**Tipo de cliente** y **Descuento fijo (%)** que se aplica solo al elegirlo en una venta. Los clientes de facturas se guardan solos.

## Vender fiado
1. En **Vender**, forma de pago **Fiado** (o una línea «Fiado» en pago mixto).
2. Elige el **Cliente del fiado** y cobra. La deuda queda en su ficha.

## Cobrar un abono (pago de un fiado o pago parcial)
1. **Clientes** → toca el cliente → **Registrar abono**.
2. **Monto** (en Venezuela puede ser en $, Bs o €), **Cómo pagó** y una nota. El saldo baja.
También se puede anotar una deuda a mano con **Nueva deuda**. Arriba se ve el **TOTAL POR COBRAR** de todos los clientes.

## Recordar por WhatsApp
En la ficha del cliente, **Recordar por WhatsApp** envía un mensaje con su **saldo pendiente** (en Venezuela con el equivalente en Bs).

## Preguntas frecuentes
- **Un cliente me pagó una parte de lo que me debe:** abre el cliente → **Registrar abono** con ese monto; el resto sigue pendiente en su saldo.
- **¿El vendedor puede cobrar fiados?** Sí, y registrar clientes. Borrar clientes es solo del administrador.
- **¿Puede quedar saldo a favor?** Sí, se muestra como «SALDO A FAVOR» (por ejemplo, tras una devolución descontada del fiado).
- **¿Me recuerda los fiados viejos?** Sí, si activas «Recordar fiados sin pagar después de (días)» en Inventario inteligente.

## Disponible / Pendiente
- ✅ Clientes con tipo y descuento fijo, fiados, abonos, saldo a favor, recordatorio por WhatsApp, exportar fiados.
- ⏳ Límite de crédito por cliente, estados de cuenta en PDF, apartados.
