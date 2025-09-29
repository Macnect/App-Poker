import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
import './styles.css'
import { useAuthStore } from './store/useAuthStore'
// ==========================================================
// ===> INICIO DEL CAMBIO: IMPORTAR SUPABASE               <===
// ==========================================================
import { supabase } from './supabase' // <-- ESTA ES LA LÍNEA QUE FALTABA
// ==========================================================
// ===> FIN DEL CAMBIO                                     <===
// ==========================================================

// Creamos una función asíncrona para inicializar la aplicación.
async function initializeApp() {
  const app = createApp(App);
  const pinia = createPinia();
  app.use(pinia);

  // Es crucial obtener el store DESPUÉS de haber instalado Pinia.
  const authStore = useAuthStore();

  // Iniciamos el listener que actualiza user y session.
  authStore.listenToAuthState();

  // Esperamos a que el listener de Supabase se inicialice y nos diga si hay
  // una sesión guardada. Esto es clave para el móvil.
  // Usamos una pequeña promesa de espera para dar tiempo a que onAuthStateChange se dispare.
  await new Promise(resolve => {
    const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
      // Una vez que tenemos una respuesta (sesión o no), podemos continuar.
      unsubscribe.data.subscription.unsubscribe(); // Dejamos de escuchar aquí para no interferir con el listener del store.
      resolve();
    });
  });

  // Ahora que sabemos si hay un usuario, comprobamos si su perfil está cargado.
  // Esto soluciona el problema de que el perfil no se cargue al reabrir la app en el móvil.
  if (authStore.user && !authStore.profile) {
    console.log("[main.js] Usuario detectado sin perfil. Forzando carga del perfil...");
    await authStore.fetchUserProfile();
  }

  app.use(i18n);
  app.mount('#app');
}

// Llamamos a la función de inicialización.
initializeApp();