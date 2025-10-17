<template>
  <div id="tournament-container">
    <main>
      <KeepAlive>
        <component :is="views[currentView]" @go-to-cash="$emit('go-to-cash')" @switch-view="switchToView" />
      </KeepAlive>
    </main>

    <!-- Menú "Más" (Overlay) -->
    <div v-if="showMoreMenu" class="more-menu-overlay" @click="showMoreMenu = false">
      <div
        class="more-menu-panel"
        @click.stop
        @touchstart="handleDragStart"
        @touchmove="handleDragMove"
        @touchend="handleDragEnd"
        :style="{ transform: `translateY(${dragOffset}px)` }"
      >
        <button v-if="authStore.rol === 'Administrador'" @click="navigateTo('AdminView')">
          🛡️ Panel de Administrador
        </button>
        <button @click="navigateTo('SavedTournamentHandsView')">🃏 Manos Guardadas</button>
        <button @click="navigateTo('SavedTournamentSessionsView')">🏆 Torneos Guardados</button>
        <button @click="navigateTo('ChartsView')">📈 Gráficos</button>
        <button @click="navigateTo('TournamentTripsView')">✈️ Viajes</button>
        <button @click="navigateTo('SavedTournamentTripsView')">🗂️ Viajes Guardados</button>
        <button @click="navigateTo('TripAccountsView')">💳 Cuentas Viajes</button>
        <button @click="navigateTo('SettingsView')">⚙️ Configuración</button>
        <button @click="authStore.signOut()" class="logout-btn">🚪 Salir</button>
      </div>
    </div>

    <!-- Barra de Navegación Inferior -->
    <nav>
      <button @click="switchToView('TournamentHandView')" :class="{ active: currentView === 'TournamentHandView' }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <!-- Primera carta -->
          <rect x="3" y="5" width="9" height="13" rx="1.5" stroke="currentColor" fill="none"/>
          <text x="7.5" y="12.5" font-size="5" fill="currentColor" text-anchor="middle">A</text>
          <!-- Segunda carta (superpuesta) -->
          <rect x="12" y="6" width="9" height="13" rx="1.5" stroke="currentColor" fill="none"/>
          <text x="16.5" y="13.5" font-size="5" fill="currentColor" text-anchor="middle">K</text>
        </svg>
        <span>Mano</span>
      </button>
      <button @click="switchToView('LiveTournamentSessionView')" :class="{ active: currentView === 'LiveTournamentSessionView' }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
        </svg>
        <span>Torneo</span>
      </button>
      <button @click="startNewTournamentHand" class="fab-nav-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <button @click="switchToView('TournamentSummaryView')" :class="{ active: currentView === 'TournamentSummaryView' }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
        <span>Sumario</span>
      </button>
      <button @click="showMoreMenu = !showMoreMenu" :class="{ active: showMoreMenu }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
        <span>Más</span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import { useTournamentStore } from '../store/tournament';
import { useAuthStore } from '../store/useAuthStore';
import TournamentHandView from './TournamentHandView.vue';
import LiveTournamentSessionView from './LiveTournamentSessionView.vue';
import TournamentSummaryView from './TournamentSummaryView.vue';
import SavedTournamentHandsView from './SavedTournamentHandsView.vue';
import SavedTournamentSessionsView from './SavedTournamentSessionsView.vue';
import TournamentTripsView from './TournamentTripsView.vue';
import SavedTournamentTripsView from './SavedTournamentTripsView.vue';
import TripAccountsView from './TripAccountsView.vue';
import ChartsView from './ChartsView.vue';
import SettingsView from './SettingsView.vue';
import AdminView from './AdminView.vue';

const emit = defineEmits(['go-to-cash']);
const tournamentStore = useTournamentStore();
const authStore = useAuthStore();

const currentView = ref('TournamentHandView');
const showMoreMenu = ref(false);

// Drag/swipe state for more menu
const dragStartY = ref(0);
const dragOffset = ref(0);
const isDragging = ref(false);

const views = shallowRef({
  TournamentHandView,
  LiveTournamentSessionView,
  TournamentSummaryView,
  SavedTournamentHandsView,
  SavedTournamentSessionsView,
  TournamentTripsView,
  SavedTournamentTripsView,
  TripAccountsView,
  ChartsView,
  SettingsView,
  AdminView,
});

function switchToView(viewName) {
  if (viewName === 'TournamentTripsView' && currentView.value !== 'SavedTournamentTripsView') {
    // Resetear el trip cuando navegamos a TournamentTripsView desde otra vista
    import('../store/useTournamentTripStore').then(({ useTournamentTripStore }) => {
      const tripStore = useTournamentTripStore();
      tripStore.resetCurrentTrip();
    });
  }
  currentView.value = viewName;
  showMoreMenu.value = false;
}

function navigateTo(viewName) {
  switchToView(viewName);
}

function startNewTournamentHand() {
  // Reset the hand and switch to TournamentHandView with 'crear' tab
  tournamentStore.resetHand();
  currentView.value = 'TournamentHandView';
}

// Drag handlers for more menu
function handleDragStart(e) {
  isDragging.value = true;
  dragStartY.value = e.touches[0].clientY;
  dragOffset.value = 0;
}

function handleDragMove(e) {
  if (!isDragging.value) return;

  const currentY = e.touches[0].clientY;
  const diff = currentY - dragStartY.value;

  // Only allow dragging down (positive values)
  if (diff > 0) {
    dragOffset.value = diff;
    // Prevent default scrolling while dragging
    e.preventDefault();
  }
}

function handleDragEnd() {
  if (!isDragging.value) return;

  isDragging.value = false;

  // If dragged more than 100px, close the menu
  if (dragOffset.value > 100) {
    showMoreMenu.value = false;
  }

  // Reset offset
  dragOffset.value = 0;
}
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   Tournament View Container
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

#tournament-container {
  width: 100%;
  max-width: 100vw;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  min-height: 100vh;
  overflow-x: hidden;
}

main {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
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
  border-top: 1px solid rgba(168, 85, 247, 0.15);

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

/* Hacer los iconos de Mano y Sesión más grandes */
nav button:nth-child(1) svg,
nav button:nth-child(2) svg {
  width: 32px;
  height: 32px;
}

.fab-nav-btn {
  width: 64px;
  height: 64px;
  min-width: 64px;
  min-height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  border: 4px solid rgba(10, 14, 26, 0.95);
  box-shadow:
    0 4px 12px rgba(168, 85, 247, 0.4),
    0 8px 24px rgba(168, 85, 247, 0.3),
    0 0 20px rgba(168, 85, 247, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: -20px;
  z-index: 10;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-nav-btn svg {
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.fab-nav-btn:active {
  transform: scale(0.95);
}

@media (hover: hover) and (pointer: fine) {
  .fab-nav-btn:hover {
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    transform: translateY(-3px) scale(1.05);
    box-shadow:
      0 8px 20px rgba(139, 92, 246, 0.45),
      0 12px 32px rgba(139, 92, 246, 0.35),
      0 0 32px rgba(139, 92, 246, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.15) inset;
  }
}

nav button.active {
  color: #a855f7;
  text-shadow: 0 0 8px rgba(168, 85, 247, 0.3);
}

nav button.active svg {
  filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.4));
  transform: scale(1.1);
}

@media (hover: hover) and (pointer: fine) {
  nav button:not(.active):hover {
    background: linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, rgba(168, 85, 247, 0.02) 100%);
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
  position: relative;

  /* Premium glass card effect */
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 1) 100%);
  border: 1px solid rgba(168, 85, 247, 0.15);

  width: 100%;
  max-width: 500px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 2rem 1.5rem 90px 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  /* Multi-layer shadow for depth */
  box-shadow:
    0 -4px 6px -1px rgba(0, 0, 0, 0.3),
    0 -10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 -20px 60px -15px rgba(168, 85, 247, 0.03);

  animation: slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* Smooth transition when releasing drag */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* Enable touch manipulation */
  touch-action: pan-y;
  user-select: none;
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

/* Premium accent line at top - Drag handle */
.more-menu-panel::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 5px;
  background: rgba(168, 85, 247, 0.5);
  border-radius: 10px;
  cursor: grab;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
}

.more-menu-panel:active::before {
  cursor: grabbing;
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
  border-color: rgba(168, 85, 247, 0.3);
  transform: translateX(4px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 0 12px rgba(168, 85, 247, 0.08);
}

.more-menu-panel button.logout-btn {
  margin-top: 0.75rem;
  border-top: 1.5px solid rgba(168, 85, 247, 0.2);
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


/* ========================================
   LANDSCAPE ORIENTATION OPTIMIZATIONS
   ======================================== */
@media (orientation: landscape) {
  nav {
    height: 65px;
  }

  nav button {
    font-size: 0.75rem;
    gap: 4px;
  }

  nav button svg {
    width: 46px;
    height: 46px;
  }

  nav button:nth-child(1) svg,
  nav button:nth-child(2) svg {
    width: 52px;
    height: 52px;
  }

  .fab-nav-btn {
    width: 60px !important;
    height: 60px !important;
    min-width: 60px !important;
    min-height: 60px !important;
    max-width: 60px;
    max-height: 60px;
    flex-basis: 60px;
    aspect-ratio: 1 / 1;
    margin-top: -20px;
    border: 3px solid rgba(10, 14, 26, 0.95);
  }

  .fab-nav-btn svg {
    width: 32px;
    height: 32px;
  }

  /* MORE MENU PANEL - Landscape Optimization */
  .more-menu-panel {
    padding: 1.5rem 1.5rem 75px 1.5rem;
    gap: 0.5rem;
    max-height: calc(100vh - 20px);
    overflow-y: auto;
    overflow-x: hidden;
    scroll-behavior: smooth;
    scrollbar-width: thin;
    scrollbar-color: rgba(168, 85, 247, 0.3) rgba(31, 41, 55, 0.3);
  }

  .more-menu-panel::-webkit-scrollbar {
    width: 6px;
  }

  .more-menu-panel::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.3);
    border-radius: 3px;
  }

  .more-menu-panel::-webkit-scrollbar-thumb {
    background: rgba(168, 85, 247, 0.3);
    border-radius: 3px;
    transition: background 0.3s ease;
  }

  .more-menu-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(168, 85, 247, 0.5);
  }

  .more-menu-panel::before {
    top: 8px;
    width: 60px;
    height: 4px;
  }

  .more-menu-panel button {
    padding: 0.7rem 1rem;
    font-size: 0.95rem;
    min-height: 44px;
    display: flex;
    align-items: center;
  }

  .more-menu-panel button.logout-btn {
    margin-top: 0.5rem;
    padding-top: 0.7rem;
  }

}
</style>
