import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
import './styles.css'
import { useAuthStore } from './store/useAuthStore' // <-- IMPORTAR

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// <-- INICIAR EL LISTENER DE AUTENTICACIÓN ANTES DE MONTAR -->
const authStore = useAuthStore()
authStore.listenToAuthState()

app.use(i18n)
app.mount('#app')