// Configuración de la nube (Firebase) del Sistema de Ventas.
// Si la pones en null, el sistema funciona sin nube (datos solo en este dispositivo).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA4VRt6XNrcNlPdWQfr4UVNeqRqTNpVpbw",
  authDomain: "sistema-ventas-e085f.firebaseapp.com",
  projectId: "sistema-ventas-e085f",
  storageBucket: "sistema-ventas-e085f.firebasestorage.app",
  messagingSenderId: "550176231446",
  appId: "1:550176231446:web:df966883f2eb51d0a06537"
};

// Dueño del sistema: solo esta cuenta ve "Licencias y clientes" y puede generar códigos de activación.
window.OWNER_UID = "3Wuh1CLsC2XeIS58uXkRSlQIXHJ2";
// Contacto que se muestra cuando falta un código o la licencia venció (ej: "WhatsApp 0414-0000000"). Vacío = genérico.
window.APP_CONTACT = "por WhatsApp al +34 663 40 79 74";
// Número de WhatsApp para pedir códigos o renovar (solo dígitos, con código de país).
window.APP_WA = "34663407974";
