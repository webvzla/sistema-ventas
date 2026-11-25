/* StockSoft · Motor de configuración regional.
   Un único catálogo de países con todo lo que cambia según dónde está el negocio: moneda, zona horaria,
   formatos, impuestos, formas de pago, documento fiscal y funciones propias del país (BCV, IGTF…).
   El resto de la aplicación NO pregunta "¿es Venezuela?": pregunta a la región (R.features.bcv, R.tax…).
   Para añadir un país basta con añadir una entrada aquí (y, si se venden licencias allí, su precio en precios.js).
   Funciona igual en el navegador (window.SSRegion) y en Node (require). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.SSRegion = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // validated:false = la configuración fiscal NO está auditada para ese país. StockSoft no afirma cumplir su normativa.
  const REGIONS = {
    VE: {
      code: 'VE', name: 'Venezuela', flag: '🇻🇪', locale: 'es-VE', tz: 'America/Caracas', cc: '58',
      // Moneda en la que se guardan los precios y los totales (base de cálculo) y moneda local de cobro.
      currency: { code: 'USD', symbol: '$', pos: 'pre', dec: 2, name: 'dólar' },
      local: { code: 'VES', symbol: 'Bs', name: 'bolívar' },
      secondary: ['EUR', 'VES'],
      dateFmt: 'dd/mm/aaaa', numFmt: '1.234,56',
      tax: { name: 'IVA', rates: [16, 8, 0], def: 16, labels: { 16: 'General 16%', 8: 'Reducido 8%', 0: 'Exento' }, included: true },
      taxId: 'RIF',
      payments: [
        ['efectivo_usd', 'Efectivo $', 'usd', true], ['efectivo_bs', 'Efectivo Bs', 'bs'], ['pago_movil', 'Pago móvil', 'bs'],
        ['punto', 'Punto de venta', 'bs'], ['transferencia', 'Transferencia', 'bs'], ['zelle', 'Zelle', 'usd', true],
        ['efectivo_eur', 'Efectivo €', 'eur', true], ['fiado', 'Fiado', 'usd']],
      docs: { fiscalNote: 'Copia de control interno: la factura legal es la de tu máquina fiscal o la de tus formularios de imprenta autorizada.' },
      features: { bcv: true, igtf: true, eurPrices: true },
      fiscal: { validated: false, status: 'Comportamiento actual de StockSoft: IVA 16/8/exento, IGTF 3 % y conversión a bolívares con la tasa BCV. Los documentos son de control interno, no fiscales.' }
    },
    ES: {
      code: 'ES', name: 'España', flag: '🇪🇸', locale: 'es-ES', tz: 'Europe/Madrid', cc: '34',
      currency: { code: 'EUR', symbol: '€', pos: 'post', dec: 2, name: 'euro' },
      local: null, secondary: [],
      dateFmt: 'dd/mm/aaaa', numFmt: '1.234,56',
      tax: { name: 'IVA', rates: [21, 10, 4, 0], def: 21, labels: { 21: 'General 21%', 10: 'Reducido 10%', 4: 'Superreducido 4%', 0: 'Exento' }, included: true },
      taxId: 'NIF',
      payments: [['efectivo', 'Efectivo', 'usd'], ['tarjeta', 'Tarjeta', 'usd'], ['bizum', 'Bizum', 'usd'], ['transf', 'Transferencia', 'usd'], ['fiado', 'Fiado', 'usd']],
      docs: { fiscalNote: 'Documento de control interno. La facturación en España (Verifactu, TicketBAI, factura simplificada) está pendiente de validación: no lo uses como factura legal.' },
      features: { bcv: false, igtf: false, eurPrices: false },
      fiscal: { validated: false, status: 'Pendiente de validación: tipos de IVA orientativos; no cubre Verifactu, TicketBAI ni el recargo de equivalencia.' }
    },
    US: {
      code: 'US', name: 'Estados Unidos', flag: '🇺🇸', locale: 'es-US', tz: 'America/New_York', cc: '1',
      currency: { code: 'USD', symbol: '$', pos: 'pre', dec: 2, name: 'dólar' },
      local: null, secondary: [],
      dateFmt: 'mm/dd/aaaa', numFmt: '1,234.56',
      tax: { name: 'Sales tax', rates: [0], def: 0, labels: { 0: 'Sin impuesto' }, included: true, custom: true },
      taxId: 'EIN / Tax ID',
      payments: [['efectivo', 'Efectivo', 'usd'], ['tarjeta', 'Tarjeta', 'usd'], ['zelle', 'Zelle', 'usd'], ['cheque', 'Cheque', 'usd'], ['transf', 'Transferencia', 'usd'], ['fiado', 'Fiado', 'usd']],
      docs: { fiscalNote: 'Recibo de control interno. El impuesto sobre ventas depende del estado y del condado: configúralo con tu contador.' },
      features: { bcv: false, igtf: false, eurPrices: false },
      fiscal: { validated: false, status: 'Pendiente de validación: el sales tax varía por estado, condado y ciudad; por defecto 0 %.' }
    },
    CO: {
      code: 'CO', name: 'Colombia', flag: '🇨🇴', locale: 'es-CO', tz: 'America/Bogota', cc: '57',
      currency: { code: 'COP', symbol: '$', pos: 'pre', dec: 0, name: 'peso' },
      local: null, secondary: [],
      dateFmt: 'dd/mm/aaaa', numFmt: '1.234,56',
      tax: { name: 'IVA', rates: [19, 5, 0], def: 19, labels: { 19: 'General 19%', 5: 'Reducido 5%', 0: 'Exento' }, included: true },
      taxId: 'NIT',
      payments: [['efectivo', 'Efectivo', 'usd'], ['tarjeta', 'Tarjeta', 'usd'], ['nequi', 'Nequi', 'usd'], ['daviplata', 'Daviplata', 'usd'], ['transf', 'Transferencia', 'usd'], ['fiado', 'Fiado', 'usd']],
      docs: { fiscalNote: 'Documento de control interno; no sustituye la factura electrónica de la DIAN.' },
      features: { bcv: false, igtf: false, eurPrices: false },
      fiscal: { validated: false, status: 'Pendiente de validación: no incluye factura electrónica DIAN.' }
    },
    MX: {
      code: 'MX', name: 'México', flag: '🇲🇽', locale: 'es-MX', tz: 'America/Mexico_City', cc: '52',
      currency: { code: 'MXN', symbol: '$', pos: 'pre', dec: 2, name: 'peso' },
      local: null, secondary: [],
      dateFmt: 'dd/mm/aaaa', numFmt: '1,234.56',
      tax: { name: 'IVA', rates: [16, 8, 0], def: 16, labels: { 16: 'General 16%', 8: 'Frontera 8%', 0: 'Tasa 0 / exento' }, included: true },
      taxId: 'RFC',
      payments: [['efectivo', 'Efectivo', 'usd'], ['tarjeta', 'Tarjeta', 'usd'], ['spei', 'Transferencia SPEI', 'usd'], ['fiado', 'Fiado', 'usd']],
      docs: { fiscalNote: 'Documento de control interno; no sustituye el CFDI del SAT.' },
      features: { bcv: false, igtf: false, eurPrices: false },
      fiscal: { validated: false, status: 'Pendiente de validación: no incluye CFDI.' }
    },
    XX: {
      code: 'XX', name: 'Otro país', flag: '🌎', locale: 'es', tz: 'UTC', cc: '',
      currency: { code: 'USD', symbol: '$', pos: 'pre', dec: 2, name: 'dólar' },
      local: null, secondary: [],
      dateFmt: 'dd/mm/aaaa', numFmt: '1.234,56',
      tax: { name: 'Impuesto', rates: [0], def: 0, labels: { 0: 'Sin impuesto' }, included: true, custom: true },
      taxId: 'Número fiscal',
      payments: [['efectivo', 'Efectivo', 'usd'], ['tarjeta', 'Tarjeta', 'usd'], ['transf', 'Transferencia', 'usd'], ['fiado', 'Fiado', 'usd']],
      docs: { fiscalNote: 'Documento de control interno.' },
      features: { bcv: false, igtf: false, eurPrices: false },
      fiscal: { validated: false, status: 'Sin configuración fiscal específica.' }
    }
  };
  // Monedas que un negocio puede elegir cuando su país lo permite (por ahora solo "Otro país").
  const CURRENCIES = {
    USD: { code: 'USD', symbol: '$', pos: 'pre', dec: 2, name: 'dólar' },
    EUR: { code: 'EUR', symbol: '€', pos: 'post', dec: 2, name: 'euro' },
    COP: { code: 'COP', symbol: '$', pos: 'pre', dec: 0, name: 'peso' },
    MXN: { code: 'MXN', symbol: '$', pos: 'pre', dec: 2, name: 'peso' },
    PEN: { code: 'PEN', symbol: 'S/', pos: 'pre', dec: 2, name: 'sol' },
    CLP: { code: 'CLP', symbol: '$', pos: 'pre', dec: 0, name: 'peso' },
    ARS: { code: 'ARS', symbol: '$', pos: 'pre', dec: 2, name: 'peso' },
    DOP: { code: 'DOP', symbol: 'RD$', pos: 'pre', dec: 2, name: 'peso' },
    PAB: { code: 'PAB', symbol: 'B/.', pos: 'pre', dec: 2, name: 'balboa' }
  };
  const DEFAULT = 'VE';
  const BCV_KEYS = ['bcv', 'eur', 'ratesAt', 'checkedAt', 'ratesSrc', 'ratesDate'];
  const clone = o => JSON.parse(JSON.stringify(o));
  const isCode = c => typeof c === 'string' && Object.prototype.hasOwnProperty.call(REGIONS, c);
  const tzOk = tz => { try { new Intl.DateTimeFormat('es', { timeZone: tz }); return true; } catch (e) { return false; } };

  /* La región de un negocio a partir de su configuración (config/main).
     Sin país guardado = negocio creado antes de la configuración regional → Venezuela "heredada"
     (todo funciona exactamente como antes). Nunca se cambia de país automáticamente. */
  function fromConfig(cfg) {
    cfg = cfg || {};
    const has = isCode(cfg.country);
    const code = has ? cfg.country : DEFAULT;
    const r = clone(REGIONS[code]);
    r.legacy = !has;
    // Dudoso: no tiene país guardado y su prefijo telefónico no es el de Venezuela. Se mantiene VE, pero se avisa.
    r.uncertain = !has && !!cfg.cc && String(cfg.cc) !== '58';
    if (cfg.tz && tzOk(cfg.tz)) r.tz = cfg.tz;
    if (code === 'XX' && cfg.currency && CURRENCIES[cfg.currency]) r.currency = clone(CURRENCIES[cfg.currency]);
    // Países donde el impuesto depende del lugar (EE. UU., "otro país"): el negocio pone sus propios tipos.
    if (r.tax.custom && Array.isArray(cfg.taxRates)) {
      const rates = [...new Set(cfg.taxRates.map(Number).filter(x => isFinite(x) && x >= 0 && x <= 50).map(x => Math.round(x * 1000) / 1000))].sort((a, b) => b - a);
      if (!rates.includes(0)) rates.push(0);
      r.tax.rates = rates; r.tax.def = rates.includes(Number(cfg.taxDef)) ? Number(cfg.taxDef) : rates[0];
      r.tax.labels = {}; rates.forEach(x => { r.tax.labels[x] = x ? r.tax.name + ' ' + x + '%' : 'Sin impuesto'; });
    }
    r.methods = {}; r.methodCur = {}; r.divisas = []; r.cash = {};
    for (const [k, label, cur, divisa] of r.payments) {
      r.methods[k] = label; r.methodCur[k] = cur;
      if (divisa) r.divisas.push(k);
      if (/^efectivo/.test(k)) r.cash[k] = cur;
    }
    return r;
  }
  const get = code => fromConfig({ country: isCode(code) ? code : DEFAULT });
  const list = () => Object.values(REGIONS).map(r => ({ code: r.code, name: r.name, flag: r.flag }));

  // Formato de dinero en la moneda base de la región (o en la moneda que se pase).
  function money(n, r, cur) {
    const c = cur || r.currency;
    const s = new Intl.NumberFormat(r.locale, { minimumFractionDigits: c.dec, maximumFractionDigits: c.dec }).format(n || 0);
    return c.pos === 'post' ? s + ' ' + c.symbol : c.symbol + s;
  }

  /* Qué cambia al pasar de una región a otra: lo que se enseña en la vista previa antes de confirmar.
     stats: {products, eurProducts, sales} del negocio (opcional). */
  function diff(fromCfg, toCode, stats) {
    const a = fromConfig(fromCfg), b = get(toCode), out = [];
    stats = stats || {};
    if (a.code === b.code) return out;
    if (a.currency.code !== b.currency.code) out.push({ k: 'currency', t: 'Moneda de los precios: ' + a.currency.code + ' → ' + b.currency.code + '. Los precios guardados conservan su número; no se convierten. Revisa tus precios después del cambio.' });
    if (a.features.bcv && !b.features.bcv) out.push({ k: 'bcv', t: 'Se desactivan la tasa BCV, la conversión a bolívares y su actualización automática.' });
    if (!a.features.bcv && b.features.bcv) out.push({ k: 'bcv', t: 'Se activan la tasa BCV (automática y a mano) y los montos en bolívares.' });
    if (a.features.igtf !== b.features.igtf) out.push({ k: 'igtf', t: b.features.igtf ? 'Se habilita el IGTF (actívalo en Ajustes si te corresponde).' : 'El IGTF deja de calcularse en las ventas nuevas.' });
    if (a.tax.rates.join() !== b.tax.rates.join()) out.push({ k: 'tax', t: b.tax.name + ': tipos disponibles ' + b.tax.rates.map(x => x + '%').join(', ') + '. Los productos conservan el % que tienen; revisa los que no existan en ' + b.name + '.' });
    out.push({ k: 'pay', t: 'Formas de pago: ' + b.payments.map(p => p[1]).join(', ') + '.' });
    if (a.tz !== b.tz) out.push({ k: 'tz', t: 'Zona horaria: ' + b.tz + '.' });
    if (a.taxId !== b.taxId) out.push({ k: 'taxid', t: 'El número fiscal se llamará ' + b.taxId + '.' });
    if (stats.eurProducts && !b.features.eurPrices) out.push({ k: 'eur', t: stats.eurProducts + ' producto(s) tienen el precio en euros: pasarán a leerse en ' + b.currency.code + ' con el mismo número.' });
    out.push({ k: 'hist', t: 'Las ventas, facturas, cobros y movimientos anteriores' + (stats.sales ? ' (' + stats.sales + ')' : '') + ' no se modifican ni se recalculan: conservan su moneda y sus importes.' });
    if (!b.fiscal.validated) out.push({ k: 'fiscal', t: 'Configuración fiscal de ' + b.name + ': ' + b.fiscal.status });
    return out;
  }

  return { REGIONS, CURRENCIES, DEFAULT, BCV_KEYS, isCode, fromConfig, get, list, money, diff, tzOk };
});
