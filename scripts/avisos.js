// Avisos por correo para los dueños de negocios StockSoft (lo ejecuta GitHub Actions, avisos.yml).
// © 2026 StockSoft. Todos los derechos reservados.
//
// Para cada negocio activo que marcó en Ajustes > Inventario inteligente "Mandármelo solo al correo":
//   - ownLow:   productos que se están agotando (una vez por producto cada 3 días)
//   - ownOrder: pedido sugerido, los lunes (según lo que se vendió en los últimos N días)
//   - report:   informe del mes anterior, el día 1
// Necesita los secretos FIREBASE_SERVICE_ACCOUNT, SMTP_USER y SMTP_PASS (y opcional SMTP_HOST, SMTP_FROM).
// Uso: node scripts/avisos.js [--dry]   (--dry: no envía ni guarda, solo muestra lo que haría)

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

const DRY = process.argv.includes('--dry');
// Los secretos a veces se pegan con espacios o saltos de línea: se limpian (la contraseña de Gmail va sin espacios).
const SMTP_USER = String(process.env.SMTP_USER || '').trim(), SMTP_PASS = String(process.env.SMTP_PASS || '').replace(/\s+/g, '');
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.SA || '{}');
if (!sa.project_id){ console.error('Falta FIREBASE_SERVICE_ACCOUNT'); process.exit(1); }
admin.initializeApp({credential: admin.credential.cert(sa)});
const fs = admin.firestore();

const TZ = 'America/Caracas';
const TRIAL_MS = 7 * 864e5;
const num = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const r2 = n => Math.round(n * 100) / 100;
const usd = n => '$' + r2(n).toLocaleString('es-VE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const qty = n => (Math.round(n * 1000) / 1000).toLocaleString('es-VE');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const UNIT = {unidad: 'und', kg: 'kg', litro: 'L', metro: 'm', paquete: 'paq', caja: 'cajas'};
const unit = u => UNIT[u || 'unidad'] || u || 'und';

// Fecha "de Venezuela" para decidir lunes / día 1.
const now = new Date();
const local = new Date(now.toLocaleString('en-US', {timeZone: TZ}));
const isMonday = local.getDay() === 1;
const isFirst = local.getDate() === 1;
const todayKey = local.getFullYear() + '-' + (local.getMonth() + 1) + '-' + local.getDate();

const tsOf = v => v && v.toMillis ? v.toMillis() : num(v);
function bizActive(b){
  if (b.blocked) return false;
  const exp = b.trial ? (tsOf(b.trialStart) || 0) + TRIAL_MS : num(b.expires);
  return exp > Date.now();
}

const mailer = DRY ? null : nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', port: 465, secure: true,
  auth: {user: SMTP_USER, pass: SMTP_PASS}
});
const FROM = (process.env.SMTP_FROM || '').trim() || ('StockSoft <' + (SMTP_USER || 'avisos@stocksoft.app') + '>');

function page(title, bizName, inner){
  return `<!doctype html><html><body style="margin:0;background:#f2f5fa;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;padding:20px">
  <div style="background:#060d1d;color:#fff;border-radius:14px 14px 0 0;padding:16px 20px"><b style="font-size:18px">STOCK<span style="color:#3cc8f2">SOFT</span></b><div style="font-size:13px;opacity:.8">${esc(bizName)}</div></div>
  <div style="background:#fff;border-radius:0 0 14px 14px;padding:20px"><h2 style="margin:0 0 12px;font-size:19px">${title}</h2>${inner}
  <p style="margin-top:22px;font-size:12px;color:#777">Recibes este correo porque lo activaste en StockSoft → Más → Ajustes → Inventario inteligente. Desmárcalo ahí para dejar de recibirlo.</p></div>
  <p style="text-align:center;font-size:11px;color:#999">StockSoft · stocksoft.app · soporte@stocksoft.app</p></div></body></html>`;
}
const table = rows => `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(r => `<tr>${r.map((c, i) => `<td style="padding:7px 4px;border-bottom:1px solid #eee;${i ? 'text-align:right;white-space:nowrap' : ''}">${c}</td>`).join('')}</tr>`).join('')}</table>`;

async function send(to, subject, html){
  if (DRY){ console.log('  [dry] →', to, '·', subject); return true; }
  try { await mailer.sendMail({from: FROM, replyTo: process.env.SMTP_REPLY_TO || 'soporte@stocksoft.app', to, subject, html}); console.log('  ✓ enviado →', to, '·', subject); return true; }
  catch(e){ console.error('  ✗ no se pudo enviar a', to, e.message); return false; }
}

async function run(){
  const bizs = await fs.collection('biz').get();
  let sent = 0;
  for (const bd of bizs.docs){
    const b = bd.data(); if (!bizActive(b)) continue;
    const ref = fs.doc('biz/' + bd.id);
    const cfgSnap = await ref.collection('config').doc('main').get();
    const cfg = cfgSnap.exists ? cfgSnap.data() : {};
    const sm = cfg.smart || {};
    if (!sm.mail || !sm.email) continue;
    const want = {low: !!sm.ownLow, order: !!sm.ownOrder && isMonday, report: sm.report !== false && isFirst};
    if (!want.low && !want.order && !want.report) continue;
    const name = cfg.name || b.name || 'tu negocio';
    console.log('Negocio', bd.id, name);

    const stRef = ref.collection('config').doc('avisos');
    const st = (await stRef.get()).data() || {};
    const prods = {}; (await ref.collection('products').get()).forEach(d => { prods[d.id] = d.data(); });
    const minStock = p => (p.min === '' || p.min == null) ? num(cfg.lowDefault) : num(p.min);
    const tracked = Object.entries(prods).filter(([, p]) => p.track !== false);

    // Ventas de los últimos días (para la velocidad de venta) y del mes pasado (informe).
    const days = Math.max(1, num(sm.days) || 30);
    const mStart = new Date(local.getFullYear(), local.getMonth() - 1, 1).getTime(), mEnd = new Date(local.getFullYear(), local.getMonth(), 1).getTime();
    const from = Math.min(Date.now() - days * 864e5, want.report ? mStart : Infinity);
    const sales = []; (await ref.collection('sales').where('ts', '>=', from).get()).forEach(d => sales.push(d.data()));
    const q = {}; for (const s of sales) if (s.ts >= Date.now() - days * 864e5 && s.doc !== 'devolucion') for (const i of (s.items || [])) if (i.pid) q[i.pid] = (q[i.pid] || 0) + num(i.qty);
    const perDay = id => (q[id] || 0) / days;
    const suggest = (id, p) => { const v = perDay(id), s = num(p.stock); let x = v > 0 ? v * (num(sm.cover) || 15) + minStock(p) - s : (s <= minStock(p) ? Math.max(minStock(p) * 2, 1) - s : 0); if (!(x > 0)) return 0; return ['unidad', 'paquete', 'caja'].includes(p.unit || 'unidad') ? Math.ceil(x) : Math.ceil(x * 10) / 10; };
    const newSt = {...st};

    if (want.low){
      const lowSeen = st.low || {}, keep = {};
      const low = tracked.filter(([id, p]) => num(p.stock) <= minStock(p) || (perDay(id) > 0 && num(p.stock) / perDay(id) <= (num(sm.soon) || 7)));
      for (const [id] of low) if (lowSeen[id] && Date.now() - lowSeen[id] < 3 * 864e5) keep[id] = lowSeen[id];
      const fresh = low.filter(([id]) => !keep[id]);
      if (fresh.length){
        const rows = fresh.map(([id, p]) => [esc(p.name) + (num(p.stock) <= 0 ? ' <b style="color:#c8202a">(agotado)</b>' : ''), 'quedan ' + qty(num(p.stock)) + ' ' + unit(p.unit) + (suggest(id, p) ? '<br><span style="color:#1d5fd6">comprar ' + qty(suggest(id, p)) + '</span>' : '')]);
        const ok = await send(sm.email, '⚠ ' + fresh.length + ' producto' + (fresh.length === 1 ? '' : 's') + ' se está' + (fresh.length === 1 ? '' : 'n') + ' agotando · ' + name,
          page('Productos que se están agotando', name, `<p>Estos productos están bajos o se acabarán pronto según lo que vendes:</p>${table(rows)}<p style="margin-top:14px">Abre StockSoft → Panel → <b>Ver pedido sugerido</b> para pedírselos a tu proveedor por WhatsApp.</p>`));
        if (ok){ sent++; for (const [id] of fresh) keep[id] = Date.now(); }
      }
      newSt.low = keep;
    }

    if (want.order && st.order !== todayKey){
      const list = tracked.map(([id, p]) => ({id, p, s: suggest(id, p), v: perDay(id)})).filter(x => x.s > 0).sort((a, b) => b.v - a.v);
      if (list.length){
        const rows = list.slice(0, 40).map(x => [esc(x.p.name) + (x.v ? '<br><span style="color:#777;font-size:12px">vendes ~' + qty(Math.round(x.v * 10) / 10) + '/día</span>' : ''), 'quedan ' + qty(num(x.p.stock)) + '<br><b>comprar ' + qty(x.s) + ' ' + unit(x.p.unit) + '</b>']);
        const ok = await send(sm.email, '🛒 Pedido sugerido de esta semana · ' + name,
          page('Pedido sugerido de esta semana', name, `<p>Calculado con lo que vendiste en los últimos ${days} días, para tener mercancía para ${num(sm.cover) || 15} días. Lo que más se vende va primero.</p>${table(rows)}`));
        if (ok){ sent++; newSt.order = todayKey; }
      }
    }

    if (want.report && st.report !== todayKey){
      const ms = sales.filter(s => s.ts >= mStart && s.ts < mEnd && s.doc !== 'devolucion');
      const mq = {}, mt = {}; let tot = 0, gan = 0;
      for (const s of ms){ tot += num(s.total) - num(s.igtf); for (const i of (s.items || [])){ gan += (num(i.price) - num(i.cost)) * num(i.qty); if (i.pid){ mq[i.pid] = (mq[i.pid] || 0) + num(i.qty); mt[i.pid] = (mt[i.pid] || 0) + num(i.price) * num(i.qty); } } }
      const cost = p => num(p.cost) * (p.cur === 'eur' && cfg.bcv ? num(cfg.eur) / num(cfg.bcv) : 1);
      const top = Object.entries(mq).filter(([id]) => prods[id]).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const least = tracked.filter(([, p]) => num(p.stock) > 0 && (!p.created || p.created < mStart)).map(([id, p]) => ({p, q: mq[id] || 0, v: r2(num(p.stock) * cost(p))})).sort((a, b) => a.q - b.q || b.v - a.v);
      const idle = least.filter(x => !x.q), idleV = r2(idle.reduce((a, x) => a + x.v, 0));
      const mes = MONTHS[new Date(mStart).getMonth()] + ' ' + new Date(mStart).getFullYear();
      const inner = `<table style="width:100%;font-size:15px"><tr><td>Ventas</td><td style="text-align:right"><b>${usd(tot)}</b></td></tr><tr><td>Nº de ventas</td><td style="text-align:right"><b>${ms.length}</b></td></tr><tr><td>Ganancia aproximada</td><td style="text-align:right"><b>${usd(gan)}</b></td></tr></table>
        <h3 style="font-size:16px;margin:18px 0 6px">🔥 Lo más vendido</h3>${top.length ? table(top.map(([id, v], i) => [(i + 1) + '. ' + esc(prods[id].name), qty(v) + ' ' + unit(prods[id].unit) + ' · ' + usd(mt[id])])) : '<p>Sin ventas.</p>'}
        <h3 style="font-size:16px;margin:18px 0 6px">🐢 Lo que menos se vende</h3>${least.length ? table(least.slice(0, 5).map((x, i) => [(i + 1) + '. ' + esc(x.p.name), qty(x.q) + ' vendidos · quedan ' + qty(num(x.p.stock))])) : '<p>—</p>'}
        ${idle.length ? `<p style="margin-top:14px">💤 <b>${idle.length}</b> producto${idle.length === 1 ? '' : 's'} sin ninguna venta: <b>${usd(idleV)}</b> de mercancía parada (a costo). Prueba una oferta o un combo.</p>` : ''}`;
      const ok = await send(sm.email, '📊 Informe de ' + mes + ' · ' + name, page('Informe de ' + mes, name, inner));
      if (ok){ sent++; newSt.report = todayKey; }
    }

    if (!DRY) await stRef.set(newSt);
  }
  console.log('Correos enviados:', sent);
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
