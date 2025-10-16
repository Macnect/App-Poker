<template>
  <div id="tournament-container">
    <main>
      <KeepAlive>
        <component :is="views[currentView]" @go-to-cash="$emit('go-to-cash')" />
      </KeepAlive>
    </main>

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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Sesión</span>
      </button>
      <button @click="startNewTournamentHand" class="fab-nav-btn">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      <button>
        <!-- Placeholder para mantener el diseño simétrico -->
      </button>
    </nav>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import { useTournamentStore } from '../store/tournament';
import TournamentHandView from './TournamentHandView.vue';
import LiveTournamentSessionView from './LiveTournamentSessionView.vue';

const emit = defineEmits(['go-to-cash']);
const tournamentStore = useTournamentStore();

const currentView = ref('TournamentHandView');

const views = shallowRef({
  TournamentHandView,
  LiveTournamentSessionView,
});

function switchToView(viewName) {
  currentView.value = viewName;
}

function startNewTournamentHand() {
  // Reset the hand and switch to TournamentHandView with 'crear' tab
  tournamentStore.resetHand();
  currentView.value = 'TournamentHandView';
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
}
</style>
