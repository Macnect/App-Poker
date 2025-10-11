<template>
  <div v-if="authStore.user" id="main-container">
    <main>
      <KeepAlive>
        <component :is="views[currentView]" @switch-view="switchToView" />
      </KeepAlive>
    </main>

    <!-- Menú "Más" (Overlay) -->
    <div v-if="showMoreMenu" class="more-menu-overlay" @click="showMoreMenu = false">
      <div class="more-menu-panel" @click.stop>
        
        <!-- ========================================================== -->
        <!-- ===> INICIO DEL CAMBIO INTEGRADO Y AISLADO              <=== -->
        <!-- ========================================================== -->
        <!-- Este botón solo se mostrará si el rol del usuario es 'Administrador'. -->
        <!-- Asegúrate de haber añadido la propiedad computada 'rol' a useAuthStore.js -->
        <button v-if="authStore.rol === 'Administrador'" @click="navigateTo('AdminView')">
          Panel de Administrador
        </button>
        <!-- ========================================================== -->
        <!-- ===> FIN DEL CAMBIO INTEGRADO Y AISLADO                 <=== -->
        <!-- ========================================================== -->
        
        <button @click="navigateTo('SavedHandsView')">{{ $t('nav.savedHands') }}</button>
        <button @click="navigateTo('SavedSessionsView')">{{ $t('nav.savedSessions') }}</button>
        <button @click="navigateTo('ChartsView')">{{ $t('nav.charts') }}</button>
        <button @click="navigateTo('CommunityView')">Viajes</button>
        <button @click="navigateTo('SavedTripsView')">Viajes Guardados</button>
        <button @click="navigateTo('SettingsView')">{{ $t('nav.settings') }}</button>
        <button @click="authStore.signOut()" class="logout-btn">Salir</button>
      </div>
    </div>

    <!-- Barra de Navegación Inferior -->
    <nav>
      <button @click="switchToView('CurrentHandView')" :class="{ active: currentView === 'CurrentHandView' }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25 1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" /></svg>
        <span>{{ $t('nav.currentHand') }}</span>
      </button>
      <button @click="switchToView('LiveSessionView')" :class="{ active: currentView === 'LiveSessionView' }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ $t('nav.liveSession') }}</span>
      </button>
      <button @click="startNewHand()" class="fab-nav-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <button @click="switchToView('SummaryView')" :class="{ active: currentView === 'SummaryView' }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
        <span>{{ $t('nav.summary') }}</span>
      </button>
      <button @click="showMoreMenu = !showMoreMenu" :class="{ active: showMoreMenu }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
        <span>Más</span>
      </button>
    </nav>

  </div>
  <AuthView v-else />
  <RotateDeviceOverlay v-if="isLandscape" />
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { useTripStore } from './store/useTripStore';
import { useAuthStore } from './store/useAuthStore';
import { useGameStore } from './store/game'; // <-- ADICIÓN
import RotateDeviceOverlay from './components/RotateDeviceOverlay.vue';
import CurrentHandView from './views/CurrentHandView.vue';
import SavedHandsView from './views/SavedHandsView.vue';
import LiveSessionView from './views/LiveSessionView.vue';
import SavedSessionsView from './views/SavedSessionsView.vue';
import ChartsView from './views/ChartsView.vue';
import SettingsView from './views/SettingsView.vue';
import SummaryView from './views/SummaryView.vue';
import CommunityView from './views/CommunityView.vue';
import SavedTripsView from './views/SavedTripsView.vue';
import AuthView from './views/AuthView.vue';
// ==========================================================
// ===> INICIO DEL CAMBIO INTEGRADO Y AISLADO              <===
// ==========================================================
import AdminView from './views/AdminView.vue';
// ==========================================================
// ===> FIN DEL CAMBIO INTEGRADO Y AISLADO                 <===
// ==========================================================

const authStore = useAuthStore();
const gameStore = useGameStore(); // <-- ADICIÓN
const currentView = ref('CurrentHandView');
const tripStore = useTripStore();
const showMoreMenu = ref(false);
const isLandscape = ref(false);

const views = shallowRef({
  CurrentHandView,
  SavedHandsView,
  LiveSessionView,
  SavedSessionsView,
  ChartsView,
  SettingsView,
  SummaryView,
  CommunityView,
  SavedTripsView,
  // ==========================================================
  // ===> INICIO DEL CAMBIO INTEGRADO Y AISLADO              <===
  // ==========================================================
  AdminView,
  // ==========================================================
  // ===> FIN DEL CAMBIO INTEGRADO Y AISLADO                 <===
  // ==========================================================
});

function switchToView(viewName) {
  if (viewName === undefined) {
    currentView.value = 'CurrentHandView';
    return;
  }
  
  if (viewName === 'CommunityView' && currentView.value !== 'SavedTripsView') {
      tripStore.resetCurrentTrip();
  }

  currentView.value = viewName;
  showMoreMenu.value = false;
}

// FUNCIÓN PARA LA NUEVA MANO AÑADIDA
function startNewHand() {
  gameStore.resetHand();
  switchToView('CurrentHandView');
}

function navigateTo(viewName) {
  switchToView(viewName);
}

onMounted(() => {
  const mediaQuery = window.matchMedia('(orientation: landscape)');
  isLandscape.value = mediaQuery.matches;
  mediaQuery.addEventListener('change', (e) => {
    isLandscape.value = e.matches;
  });
});
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   Global Styles for App Container
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

/* Apply Poppins font to all elements */
* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#main-container {
  width: 100%;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  min-height: 100vh;
}

main {
  width: 100%;
}

/* ========================================
   BOTTOM NAVIGATION - Premium Style
   ======================================== */
nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;

  /* Premium gradient background */
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 1) 100%);
  border-top: 1px solid rgba(212, 175, 55, 0.15);

  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;

  /* Enhanced shadow */
  box-shadow:
    0 -4px 6px -1px rgba(0, 0, 0, 0.3),
    0 -10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;

  backdrop-filter: blur(10px);
}

nav button {
  background-color: transparent;
  border: none;
  color: #9ca3af;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  flex-grow: 1;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.025em;
}

nav button svg {
  width: 24px;
  height: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-nav-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #047857 0%, #059669 100%);
  border: 4px solid rgba(10, 14, 26, 0.95);
  box-shadow:
    0 4px 12px rgba(4, 120, 87, 0.4),
    0 8px 24px rgba(4, 120, 87, 0.3),
    0 0 20px rgba(4, 120, 87, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -20px; /* to make it stick out above the nav */
  z-index: 10;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-nav-btn svg {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.fab-nav-btn:active {
  transform: scale(0.95);
}

@media (hover: hover) and (pointer: fine) {
  .fab-nav-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    transform: translateY(-3px) scale(1.05);
    box-shadow:
      0 8px 20px rgba(4, 120, 87, 0.45),
      0 12px 32px rgba(4, 120, 87, 0.35),
      0 0 32px rgba(4, 120, 87, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  }
}

nav button.active {
  color: #d4af37;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
}

nav button.active svg {
  filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.4));
  transform: scale(1.1);
}

@media (hover: hover) and (pointer: fine) {
  nav button:not(.active):hover {
    background: linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 100%);
    color: #d1d5db;
  }

  nav button:not(.active):hover svg {
    transform: translateY(-2px) scale(1.05);
  }
}

/* ========================================
   MORE MENU OVERLAY - Premium Modal
   ======================================== */
.more-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 14, 26, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.more-menu-panel {
  /* Premium glass card effect */
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 1) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);

  width: 100%;
  max-width: 500px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 1.5rem;
  padding-bottom: 90px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  /* Multi-layer shadow for depth */
  box-shadow:
    0 -4px 6px -1px rgba(0, 0, 0, 0.3),
    0 -10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 -20px 60px -15px rgba(212, 175, 55, 0.03);

  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Premium accent line at top */
.more-menu-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 4px;
  background: rgba(212, 175, 55, 0.4);
  border-radius: 0 0 4px 4px;
}

.more-menu-panel button {
  width: 100%;
  padding: 1.1rem 1.25rem;
  font-size: 1.05rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;

  /* Premium button styling */
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.5) 0%, rgba(31, 41, 55, 0.7) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.15);
  border-radius: 12px;
  color: #f9fafb;

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.more-menu-panel button:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
  border-color: rgba(212, 175, 55, 0.3);
  transform: translateX(4px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.more-menu-panel button.logout-btn {
  margin-top: 0.75rem;
  border-top: 1.5px solid rgba(212, 175, 55, 0.2);
  padding-top: 1.25rem;
  color: #f87171;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(185, 28, 28, 0.15) 100%);
  border-color: rgba(220, 38, 38, 0.2);
}

.more-menu-panel button.logout-btn:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(185, 28, 28, 0.25) 100%);
  border-color: rgba(220, 38, 38, 0.4);
  color: #fca5a5;
}

</style>