// Configuración del ENTORNO DE PRUEBAS: proyecto de Firebase SEPARADO "stocksoft-pruebas"
// (base de datos, cuentas y reglas propias; nada que ver con los clientes reales).
// .github/workflows/pruebas.yml la copia sobre public/app/firebase-config.js al publicar la versión de pruebas.
// Producción sigue usando web/firebase-config.js (proyecto de producción), que no se toca.
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyD_a-uAX_eui_i0xMmssK-U_ypUYnqE8PM",
  authDomain: "stocksoft-pruebas.firebaseapp.com",
  projectId: "stocksoft-pruebas",
  storageBucket: "stocksoft-pruebas.firebasestorage.app",
  messagingSenderId: "718618685515",
  appId: "1:718618685515:web:0e320ad0479987cda79dce"
};
// Dueño del sistema en pruebas: una cuenta de prueba (variable OWNER_UID_PRUEBAS del repositorio), nunca la real.
window.OWNER_UID = "__OWNER_UID_PRUEBAS__";
// WhatsApp de StockSoft desactivado hasta tener un número de empresa (APP_WA vacío oculta sus botones).
window.APP_CONTACT = "por correo a soporte@stocksoft.app";
window.APP_WA = "";
window.STOCKSOFT_ENV = "pruebas";
// StockSoft Assistant: con enabled:false responde en "modo guía" (sin IA y sin coste).
// Gemini (Firebase AI Logic + App Check) está PREPARADO Y APAGADO, pendiente de autorización y financiación del titular de StockSoft:
// no cambiar a true sin su autorización expresa (sus condiciones exigen servicio de pago para usuarios de la UE).
// No hay claves privadas aquí; appCheckKey sería pública.
window.ASSISTANT = { enabled: false, model: "gemini-3.1-flash-lite", appCheckKey: "" };
