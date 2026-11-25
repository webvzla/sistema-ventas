/* StockSoft · Catálogo de licencias (un único plan con todo; solo cambia la duración).
   Lo usan la tienda de la app (para enseñar precios) y el servidor (que es quien decide el precio de verdad:
   lo que mande el navegador se ignora). Importes en CÉNTIMOS para no arrastrar errores de redondeo.
   Funciona en el navegador (window.SSPrices) y en Node (require). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.SSPrices = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const PLAN = {
    name: 'StockSoft completo',
    features: ['Ventas, caja y cotizaciones', 'Inventario con vencimientos, etiquetas e importación de Excel', 'Clientes, fiados y proveedores',
      'Facturas, tickets y notas de entrega', 'Reportes y avisos al dueño', 'Usuarios administrador y vendedor', 'Web, móvil y programa de PC', 'Soporte por WhatsApp y correo']
  };
  const DURATIONS = [
    { id: 'm1', months: 1, label: '1 mes' },
    { id: 'm3', months: 3, label: '3 meses' },
    { id: 'm6', months: 6, label: '6 meses' },
    { id: 'm12', months: 12, label: '12 meses' }
  ];
  /* Precios por región. Solo Venezuela tiene precios aprobados.
     Para otro país: añadir aquí su entrada cuando Francisco apruebe los importes. Mientras no exista, la tienda
     de ese país enseña "precio pendiente" y el servidor rechaza el pago (no se inventan precios). */
  const PRICES = {
    VE: { currency: 'USD', normal: { m1: 599, m3: 1699, m6: 2999, m12: 4999 }, promo: { m1: 479, m3: 1359, m6: 2399, m12: 3999 } }
  };
  // Promoción de lanzamiento: 20 % durante 60 días desde promoStart (configurable por el dueño en store/config).
  // Sin promoStart no hay promoción. Solo para clientes nuevos (nunca pagaron ni canjearon un código); nunca en renovaciones.
  const PROMO = { pct: 20, days: 60 };
  const DAY = 864e5;

  const duration = id => DURATIONS.find(d => d.id === id) || null;
  const priceTable = region => PRICES[region] || null;
  function promoWindow(store) {
    const start = Number(store && store.promoStart) || 0;
    const days = Number(store && store.promoDays) || PROMO.days;
    return start ? { start, end: start + days * DAY, days } : null;
  }
  /* Precio de una duración para un negocio.
     ctx: {now, store:{promoStart,promoDays}, isNew}. Devuelve null si no hay precio para esa región/duración. */
  function quote(region, durId, ctx) {
    ctx = ctx || {};
    const t = priceTable(region), d = duration(durId);
    if (!t || !d || !t.normal[d.id]) return null;
    const now = Number(ctx.now) || Date.now(), w = promoWindow(ctx.store);
    const inWindow = !!w && now >= w.start && now < w.end;
    const promo = inWindow && !!ctx.isNew && !!t.promo && t.promo[d.id] > 0;
    const normal = t.normal[d.id], final = promo ? t.promo[d.id] : normal;
    return { region, dur: d.id, months: d.months, label: d.label, currency: t.currency, normal, final, promo, pct: promo ? Math.round((1 - final / normal) * 100) : 0, promoEnds: promo ? w.end : 0 };
  }
  function offers(region, ctx) { return DURATIONS.map(d => quote(region, d.id, ctx)).filter(Boolean); }
  const fmt = (cents, currency) => (currency === 'EUR' ? '' : '$') + (cents / 100).toFixed(2).replace('.', ',') + (currency === 'EUR' ? ' €' : '');
  // Suma meses a una fecha (ms) conservando el día; se usa igual en la app y en el servidor.
  function addMonths(ts, m) { const d = new Date(ts); const day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + m); const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(day, last)); return d.getTime(); }

  return { PLAN, DURATIONS, PRICES, PROMO, DAY, duration, priceTable, promoWindow, quote, offers, fmt, addMonths };
});
