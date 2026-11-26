---
id: asistente
roles: [administrador, vendedor]
pantallas: [StockSoft Assistant, Nueva conversación, Preguntar a StockSoft Assistant]
verificado: 2026-11-26 · rama pruebas (asistente en modo guía; Gemini pendiente de activar)
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
1. Abre el asistente y escribe tu pregunta (por ejemplo: «¿Cómo hago una nota de entrega?»).
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
- **Con IA (Gemini mediante Firebase AI Logic):** redacta la respuesta usando solo esas secciones. Pendiente de activar.

## Límites
- Hasta 500 caracteres por pregunta.
- Con IA: 20 preguntas por hora y 60 al día por usuario, y 300 al día por negocio. Al llegar al límite sigue funcionando en modo guía.

## Disponible / Pendiente
- ✅ Chat con historial de la sesión, nueva conversación, modo guía con las guías reales, en PC y móvil.
- ⏳ Respuestas redactadas con IA (Gemini): preparado, pendiente de activación y de autorización.
- ❌ Hacer cambios en el negocio o consultar sus datos: el asistente nunca lo hará.
