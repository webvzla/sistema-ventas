// Configuración del ENTORNO DE PRUEBAS: proyecto de Firebase SEPARADO "stocksoft-pruebas"
// (base de datos, cuentas y reglas propias; nada que ver con los clientes reales).
// .github/workflows/pruebas.yml la copia sobre public/app/firebase-config.js al publicar la versión de pruebas.
// Producción sigue usando web/firebase-config.js (proyecto sistema-ventas-e085f), que no se toca.
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
window.APP_CONTACT = "por WhatsApp al +34 663 40 79 74";
window.APP_WA = "34663407974";
window.STOCKSOFT_ENV = "pruebas";
