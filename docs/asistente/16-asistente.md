---
id: asistente
roles: [administrador, vendedor]
pantallas: [StockSoft Assistant, Nueva conversación, Preguntar a StockSoft Assistant]
verificado: 2026-11-26 · rama pruebas (modo guía; Gemini pendiente de autorización y financiación)
---
# StockSoft Assistant

## Qué es
Un asistente de conversación que explica **cómo usar StockSoft** con los nombres reales de pantallas y botones.
**Es solo informativo:** no registra ventas, compras, cobros, abonos ni gastos, no cambia productos, precios, impuestos,
clientes ni proveedores, y no ve los datos de tu negocio.

## Dónde está
- Botón **✨** (StockSoft Assistant) arriba a la derecha.
- **Más → Ayuda → ✨ Preguntar a StockSoft Assistant**.

## Cómo se usa
1. Abre el asistente y escribe tu pregunta (por ejemplo: «¿Cómo hago una nota de entrega?») o toca una de las **preguntas sugeridas**.
2. Responde con pasos cortos y dice de qué guía sacó la información («Fuente: …»).
3. **Nueva conversación** borra el chat. La conversación se guarda mientras tengas la sesión abierta.
Funciona en ordenador y en móvil (en el móvil ocupa toda la pantalla).

## De dónde saca las respuestas
- Solo de esta base de conocimiento (`docs/asistente/`). Para cada pregunta busca en el índice las guías relacionadas y usa solo
  las secciones necesarias, más «Problemas frecuentes» y «Limitaciones».
- Si no lo encuentra, lo dice y recomienda escribir a soporte desde **Más → Ayuda → Contactar con soporte**.
- No afirma que StockSoft cumpla requisitos legales o fiscales.

## Modos
- **Modo guía (sin IA):** muestra las secciones de las guías que responden a tu pregunta. Es el modo actual.
- **Con IA (Gemini mediante Firebase AI Logic):** redactaría la respuesta usando solo esas secciones. La integración está preparada pero **apagada**. **Pendiente de autorización y financiación:** no se activará hasta que el titular de StockSoft lo autorice y StockSoft tenga ingresos (sus condiciones exigen servicio de pago para usuarios de la UE).

## Preguntas frecuentes
- **¿Me puedes dar una contraseña o una clave?** No. El asistente nunca da ni pide contraseñas ni claves. Para cambiar la tuya: **Más → Cambiar mi contraseña**; si la olvidaste, **¿Olvidaste tu contraseña?** en la entrada.
- **¿Puedes hacer la venta (o el cambio) por mí?** No, solo explica cómo hacerlo.

## Privacidad: no muestra tus ventas ni las de otros negocios
- **¿Puedes ver mis ventas o las de otro negocio?** No. El asistente no tiene acceso a ventas, clientes ni productos de ningún negocio.
- En StockSoft cada negocio solo ve sus propios datos: nadie puede ver los de otro negocio.

## Límites
- Hasta 500 caracteres por pregunta.
- Con IA (cuando se active): 20 preguntas por hora y 60 al día por usuario, y 300 al día por negocio. Al llegar al límite sigue funcionando en modo guía.
- El modo guía no tiene coste ni límite de preguntas: solo lee las guías publicadas con la app.

## Disponible / Pendiente
- ✅ Chat con historial de la sesión, nueva conversación, modo guía con las guías reales, en PC y móvil.
- ⏳ Respuestas redactadas con IA (Gemini): preparado y apagado. **Pendiente de autorización y financiación:** no se activará hasta que el titular de StockSoft lo autorice y StockSoft tenga ingresos (sus condiciones exigen servicio de pago para usuarios de la UE).
- ❌ Hacer cambios en el negocio o consultar sus datos: el asistente nunca lo hará.
