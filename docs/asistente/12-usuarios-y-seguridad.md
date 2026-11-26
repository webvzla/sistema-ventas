---
id: usuarios
roles: [administrador, vendedor]
pantallas: [Usuarios, + Nuevo usuario, Empleado creado, Cambiar mi contraseña, Registro de actividad]
verificado: 2026-11-26 · rama pruebas 5c637a0
---
# Usuarios, permisos y seguridad

## Roles
| Puede… | Administrador | Vendedor |
|---|---|---|
| Vender, cobrar, cotizar, ver precios y stock | ✅ | ✅ |
| Registrar clientes y cobrar fiados | ✅ | ✅ |
| Abrir y cerrar caja | ✅ | ✅ |
| Dar descuentos | ✅ sin límite | ✅ hasta el máximo de Ajustes |
| Crear, editar o borrar productos y precios; importar | ✅ | ❌ |
| Ver costos, ganancias, Dashboard, reportes | ✅ | ❌ |
| Proveedores, gastos, usuarios, ajustes, licencia | ✅ | ❌ |
| Corregir, devolver o anular ventas | ✅ | ❌ |
| Cambiar país o impuestos | ✅ | ❌ |
Estos permisos también los aplica el servidor: un vendedor no puede saltárselos.

## Crear un usuario
**Más → Usuarios → + Nuevo usuario**: nombre, **Rol** y **Cómo entra**: con **correo y contraseña**, o **sin correo** con un usuario automático
(por ejemplo maria-4821) y un **PIN** de 6 a 12 números. Al crearlo se muestran los datos para copiarlos o enviarlos por WhatsApp.
En la lista: **Contraseña**, **Hacer vendedor/admin**, **Eliminar**.

## Contraseñas y sesión
- **Más → Cambiar mi contraseña** (contraseña actual y la nueva dos veces).
- ¿Olvidada? En la entrada: **¿Olvidaste tu contraseña?** (llega un correo). Los empleados con PIN se la piden al administrador.
- Opción para mantener la sesión abierta en ese dispositivo.

## Registro de actividad
**Más → Registro de actividad** (administrador): quién vendió, cotizó, abrió o cerró caja, cambió precios, corrigió ventas, cambió el país o los impuestos.

## Disponible / Pendiente
- ✅ Dos roles, empleados con PIN, permisos en el servidor, recuperación de contraseña, registro de actividad.
- ⏳ Roles personalizados (p. ej. encargado), verificación en dos pasos, cerrar sesión en otros dispositivos.
