// Reglas de Firestore (firestore.rules) contra el EMULADOR: región por negocio, aislamiento BCV, permisos y licencias.
// Proyecto "demo-stocksoft": nunca toca Firebase real.
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { T, end } = require('./lib/t').suite('reglas');
const RULES = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
const OWNER = '3Wuh1CLsC2XeIS58uXkRSlQIXHJ2';
const ok = async p => { try { await assertSucceeds(p); return true; } catch (e) { return e.message; } };
const ko = async p => { try { await assertFails(p); return true; } catch (e) { return 'NO falló: ' + e.message; } };

(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');
  const te = await initializeTestEnvironment({ projectId: 'demo-stocksoft', firestore: { rules: RULES, host, port: +port } });
  const seed = async () => {
    await te.clearFirestore();
    await te.withSecurityRulesDisabled(async c => {
      const db = c.firestore();
      for (const [b, country] of [['bizVE', null], ['bizES', 'ES'], ['bizVE2', 'VE']]) {
        await db.doc('biz/' + b).set({ name: b, owner: b, trial: false, license: 'L-' + b, expires: 0 });
        await db.doc(`biz/${b}/members/${b}`).set({ role: 'admin', name: 'Admin ' + b });
        await db.doc(`biz/${b}/members/v_${b}`).set({ role: 'vendedor', name: 'Vend ' + b });
        await db.doc(`biz/${b}/config/main`).set(country ? { name: b, country, regionBy: b } : { name: b, bcv: 200 });
      }
    });
  };
  const as = uid => te.authenticatedContext(uid, { email: uid + '@x.com' }).firestore();
  await seed();

  // ---- País por negocio ----
  T('S1', 'Administrador cambia el país de su negocio (firmado con su uid)', await ok(as('bizVE').doc('biz/bizVE/config/main').set({ country: 'ES', regionBy: 'bizVE', regionAt: 1 }, { merge: true })) === true);
  await seed();
  T('S2', 'Vendedor NO puede cambiar el país', await ko(as('v_bizVE').doc('biz/bizVE/config/main').set({ country: 'ES', regionBy: 'v_bizVE' }, { merge: true })) === true);
  T('S3', 'Administrador no puede firmar el cambio con el uid de otro', await ko(as('bizVE').doc('biz/bizVE/config/main').set({ country: 'ES', regionBy: 'otro' }, { merge: true })) === true);
  T('S4', 'País inexistente rechazado', await ko(as('bizVE').doc('biz/bizVE/config/main').set({ country: 'ZZ', regionBy: 'bizVE' }, { merge: true })) === true);
  T('S4b', 'País sin configuración propia del catálogo (Perú) aceptado; firmado por el administrador', await ok(as('bizVE').doc('biz/bizVE/config/main').set({ country: 'PE', regionBy: 'bizVE', taxes: [{ id: 'igv', name: 'IGV', rate: 18, inc: true }], taxDef: 'igv' }, { merge: true })) === true);
  T('S4c', 'Vendedor NO puede cambiar los impuestos del negocio', await ko(as('v_bizVE').doc('biz/bizVE/config/main').set({ taxes: [], taxDef: '' }, { merge: true })) === true);
  await seed();
  T('S5', 'Administrador de un negocio no puede cambiar la región de otro', await ko(as('bizES').doc('biz/bizVE/config/main').set({ country: 'ES', regionBy: 'bizES' }, { merge: true })) === true);

  // ---- Aislamiento BCV ----
  T('B1', 'Negocio venezolano heredado (sin país): vendedor guarda la tasa (como antes)', await ok(as('v_bizVE').doc('biz/bizVE/config/main').set({ bcv: 231.5, ratesAt: 1 }, { merge: true })) === true);
  T('B2', 'Negocio venezolano heredado: escribir rates/ permitido', await ok(as('v_bizVE').doc('biz/bizVE/rates/2026-12-01').set({ bcv: 231.5, ts: 1 })) === true);
  T('B3', 'Negocio venezolano explícito: rates/ permitido', await ok(as('bizVE2').doc('biz/bizVE2/rates/2026-12-01').set({ bcv: 231.5, ts: 1 })) === true);
  T('B4', 'Negocio español: vendedor NO puede escribir la tasa BCV en la configuración', await ko(as('v_bizES').doc('biz/bizES/config/main').set({ bcv: 231.5 }, { merge: true })) === true);
  T('B5', 'Negocio español: ni el administrador puede escribir claves BCV (petición manipulada)', await ko(as('bizES').doc('biz/bizES/config/main').set({ bcv: 231.5, eur: 250 }, { merge: true })) === true);
  T('B6', 'Negocio español: escribir rates/ (historial BCV) rechazado, también para el administrador', await ko(as('bizES').doc('biz/bizES/rates/2026-12-01').set({ bcv: 1 })) === true);
  T('B7', 'Negocio español: el administrador sí guarda sus otros ajustes', await ok(as('bizES').doc('biz/bizES/config/main').set({ name: 'Tienda Madrid', rif: 'B123' }, { merge: true })) === true);
  T('B8', 'Pasar de España a Venezuela y escribir la tasa en la misma operación: permitido', await ok(as('bizES').doc('biz/bizES/config/main').set({ country: 'VE', regionBy: 'bizES', bcv: 231 }, { merge: true })) === true);
  await seed();
  T('B9', 'Pasar de Venezuela a España dejando una tasa nueva en la misma operación: rechazado', await ko(as('bizVE').doc('biz/bizVE/config/main').set({ country: 'ES', regionBy: 'bizVE', bcv: 999 }, { merge: true })) === true);
  T('B10', 'Pasar de Venezuela a España sin tocar la tasa guardada: permitido (no se borra nada)', await ok(as('bizVE').doc('biz/bizVE/config/main').set({ country: 'ES', regionBy: 'bizVE' }, { merge: true })) === true);
  await seed();

  T('S6', 'Vendedor puede avanzar la numeración de documentos simplificados (simpSeq) como la de notas', await ok(as('v_bizVE').doc('biz/bizVE/config/main').set({ simpSeq: 3 }, { merge: true })) === true);
  T('S7', 'Cada usuario puede marcar SOLO en su ficha que vio el tutorial; no puede cambiarse el rol ni tocar la ficha de otro', (await ok(as('v_bizVE').doc('biz/bizVE/members/v_bizVE').set({ tourDone: 1 }, { merge: true }))) === true && (await ko(as('v_bizVE').doc('biz/bizVE/members/v_bizVE').set({ role: 'admin', tourDone: 2 }, { merge: true }))) === true && (await ko(as('v_bizVE').doc('biz/bizVE/members/bizVE').set({ tourDone: 1 }, { merge: true }))) === true);
  T('S8', 'Vendedor puede poner el nº de nota de entrega a una venta, pero no cambiar su total', (await ok(as('v_bizVE').doc('biz/bizVE/sales/v9').set({ total: 5, ts: 1 }))) === true && (await ok(as('v_bizVE').doc('biz/bizVE/sales/v9').set({ total: 5, ts: 1, noteNo: 'NE-000001' }))) === true && (await ko(as('v_bizVE').doc('biz/bizVE/sales/v9').set({ total: 1, ts: 1, noteNo: 'NE-000001' }))) === true);
  await seed();

  T('S9', 'Contador del asistente: solo se suma de 1 en 1 hasta 300; no se puede poner otro valor ni otros campos', (await ok(as('v_bizVE').doc('biz/bizVE/assistUse/2026-11-26').set({ n: 1 }))) === true && (await ok(as('v_bizVE').doc('biz/bizVE/assistUse/2026-11-26').set({ n: 2 }))) === true && (await ko(as('v_bizVE').doc('biz/bizVE/assistUse/2026-11-26').set({ n: 0 }))) === true && (await ko(as('v_bizVE').doc('biz/bizVE/assistUse/2026-11-26').set({ n: 3, x: 1 }))) === true && (await ko(as('bizES').doc('biz/bizVE/assistUse/2026-11-26').get())) === true);
  await seed();

  // ---- Licencias y tienda ----
  T('L1', 'Administrador NO puede escribirse historial de licencia (compras falsas)', await ko(as('bizVE').doc('biz/bizVE/licHistory/x').set({ type: 'compra', months: 12, at: 1 })) === true);
  T('L2', 'Administrador NO puede alargarse la licencia a mano', await ko(as('bizVE').doc('biz/bizVE').update({ expires: 9e12 })) === true);
  T('L3', 'Administrador NO puede marcar paidOnce/courtesy (manipular la promoción)', await ko(as('bizVE').doc('biz/bizVE').update({ courtesy: true })) === true);
  T('L4', 'Administrador lee su historial de licencia', await ok(as('bizVE').doc('biz/bizVE/licHistory/x').get()) === true);
  T('L5', 'Vendedor NO lee el historial de licencia', await ko(as('v_bizVE').doc('biz/bizVE/licHistory/x').get()) === true);
  T('L6', 'Otro negocio NO lee el historial de licencia ajeno', await ko(as('bizES').doc('biz/bizVE/licHistory/x').get()) === true);
  T('L7', 'Dueño del sistema concede cortesía (historial tipo cortesía + vencimiento)', await ok((async () => { const db = as(OWNER); const b = db.batch(); b.set(db.doc('biz/bizVE'), { trial: false, expires: 9e12, courtesy: true }, { merge: true }); b.set(db.doc('biz/bizVE/licHistory/c1'), { type: 'cortesia', days: 30, by: OWNER, at: 1 }); await b.commit(); })()) === true);
  T('L8', 'Dueño del sistema NO puede registrar una cortesía como compra', await ko(as(OWNER).doc('biz/bizVE/licHistory/c2').set({ type: 'compra', by: OWNER, at: 1 })) === true);
  T('L9', 'Nadie (cliente) puede crear pedidos ni pagos: solo el servidor', (await ko(as('bizVE').doc('orders/o1').set({ biz: 'bizVE', uid: 'bizVE', status: 'paid' }))) === true && (await ko(as('bizVE').doc('payments/p1').set({ x: 1 }))) === true);
  await te.withSecurityRulesDisabled(async c => { await c.firestore().doc('orders/o1').set({ biz: 'bizVE', uid: 'bizVE', status: 'pending' }); });
  T('L10', 'El comprador lee su pedido; otro usuario no', (await ok(as('bizVE').doc('orders/o1').get())) === true && (await ko(as('bizES').doc('orders/o1').get())) === true);
  T('L11', 'store/config: lo leen los usuarios y solo lo escribe el dueño', (await ok(as('bizVE').doc('store/config').get())) === true && (await ko(as('bizVE').doc('store/config').set({ promoStart: 1 }))) === true && (await ok(as(OWNER).doc('store/config').set({ promoStart: 1 }))) === true);

  // ---- Regresión de permisos existentes ----
  T('G1', 'Administrador sigue gestionando proveedores (colección genérica)', await ok(as('bizVE').doc('biz/bizVE/suppliers/s1').set({ name: 'Prov' })) === true);
  T('G2', 'Vendedor sigue sin acceso a proveedores', await ko(as('v_bizVE').doc('biz/bizVE/suppliers/s1').get()) === true);
  T('G3', 'Vendedor sigue pudiendo vender (sales/create)', await ok(as('v_bizVE').doc('biz/bizVE/sales/v1').set({ total: 1, ts: 1 })) === true);
  T('G4', 'Vendedor sigue sin poder cambiar precios (products: solo stock)', await ko(as('v_bizVE').doc('biz/bizVE/products/p1').set({ price: 1 })) === true);
  T('G5', 'Aislamiento: un negocio no lee ventas de otro', await ko(as('bizES').doc('biz/bizVE/sales/v1').get()) === true);
  T('G6', 'Administrador sigue guardando numeración y ajustes (noteSeq, igtf)', await ok(as('bizVE').doc('biz/bizVE/config/main').set({ noteSeq: 5, igtf: true }, { merge: true })) === true);
  T('G7', 'Prueba gratis: crear negocio en prueba sigue funcionando', await ok((async () => { const db = te.authenticatedContext('nuevo1', { email: 'n@x.com' }).firestore(); const firebase = require('firebase/compat/app'); const b = db.batch();
    b.set(db.doc('biz/nuevo1'), { name: 'Nuevo', owner: 'nuevo1', created: 1, trial: true, trialStart: firebase.firestore.FieldValue.serverTimestamp() });
    b.set(db.doc('biz/nuevo1/members/nuevo1'), { name: 'A', role: 'admin', email: 'n@x.com', created: 1 });
    b.set(db.doc('users/nuevo1'), { biz: 'nuevo1', role: 'admin', name: 'A', email: 'n@x.com' }); await b.commit();
    await db.doc('biz/nuevo1/config/main').set({ name: 'Nuevo', country: 'ES', regionBy: 'nuevo1', regionAt: 1, tz: 'Europe/Madrid' }); })()) === true);
  T('G8', 'Negocio nuevo español: config inicial con país firmado; sin tasa', await ko(as('nuevo1').doc('biz/nuevo1/config/main').set({ bcv: 1 }, { merge: true })) === true);

  T('G9', 'Regresión: crear la configuración de un negocio español con campos BCV (aunque sean 0) se rechaza', await ko((async () => { const db = te.authenticatedContext('nuevo2', { email: 'n2@x.com' }).firestore(); const firebase = require('firebase/compat/app'); const b = db.batch();
    b.set(db.doc('biz/nuevo2'), { name: 'N2', owner: 'nuevo2', created: 1, trial: true, trialStart: firebase.firestore.FieldValue.serverTimestamp() });
    b.set(db.doc('biz/nuevo2/members/nuevo2'), { name: 'A', role: 'admin', email: 'n2@x.com', created: 1 });
    b.set(db.doc('users/nuevo2'), { biz: 'nuevo2', role: 'admin', name: 'A', email: 'n2@x.com' }); await b.commit();
    await db.doc('biz/nuevo2/config/main').set({ name: 'N2', country: 'ES', regionBy: 'nuevo2', bcv: 0, eur: 0, ratesAt: 0 }); })()) === true);
  await te.cleanup();
  process.exit(end() ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
