import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
import './styles.css'
import { useAuthStore } from './store/useAuthStore'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Obtenemos el store de autenticación e iniciamos el listener.
// La app NO esperará, se montará inmediatamente.
const authStore = useAuthStore()
authStore.listenToAuthState() // Usaremos un nuevo listener simple

app.use(i18n)
app.mount('#app')