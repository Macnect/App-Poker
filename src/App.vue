<template>
  <div id="main-container">
    <nav>
      <button @click="currentView = 'CurrentHandView'" :class="{ active: currentView === 'CurrentHandView' }">
        {{ $t('nav.currentHand') }}
      </button>
      <button @click="currentView = 'SavedHandsView'" :class="{ active: currentView === 'SavedHandsView' }">
        {{ $t('nav.savedHands') }}
      </button>
      <button @click="currentView = 'LiveSessionView'" :class="{ active: currentView === 'LiveSessionView' }">
        {{ $t('nav.liveSession') }}
      </button>
      <button @click="currentView = 'SavedSessionsView'" :class="{ active: currentView === 'SavedSessionsView' }">
        {{ $t('nav.savedSessions') }}
      </button>
      <button @click="currentView = 'ChartsView'" :class="{ active: currentView === 'ChartsView' }">
        {{ $t('nav.charts') }}
      </button>
      <button @click="currentView = 'SummaryView'" :class="{ active: currentView === 'SummaryView' }">
        {{ $t('nav.summary') }}
      </button>
      <!-- BOTÓN COMUNIDAD MODIFICADO PARA RESETEAR -->
      <button @click="switchToView('CommunityView')" :class="{ active: currentView === 'CommunityView' }">
        Viajes
      </button>
      <!-- BOTÓN NUEVO PARA VIAJES GUARDADOS -->
      <button @click="currentView = 'SavedTripsView'" :class="{ active: currentView === 'SavedTripsView' }">
        Viajes Guardados
      </button>
      <button @click="currentView = 'SettingsView'" :class="{ active: currentView === 'SettingsView' }">
        {{ $t('nav.settings') }}
      </button>
    </nav>
    <main>
      <!-- EMISOR DE EVENTOS MODIFICADO -->
      <component :is="views[currentView]" @switch-view="switchToView" />
    </main>
  </div>
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import { useTripStore } from './store/useTripStore'; // <-- 1. IMPORTAR EL TRIP STORE
import CurrentHandView from './views/CurrentHandView.vue';
import SavedHandsView from './views/SavedHandsView.vue';
import LiveSessionView from './views/LiveSessionView.vue';
import SavedSessionsView from './views/SavedSessionsView.vue';
import ChartsView from './views/ChartsView.vue';
import SettingsView from './views/SettingsView.vue';
import SummaryView from './views/SummaryView.vue';
import CommunityView from './views/CommunityView.vue';
import SavedTripsView from './views/SavedTripsView.vue'; // <-- 2. IMPORTAR LA NUEVA VISTA

const currentView = ref('CurrentHandView');
const tripStore = useTripStore(); // <-- 3. INICIALIZAR EL TRIP STORE

const views = shallowRef({
  CurrentHandView,
  SavedHandsView,
  LiveSessionView,
  SavedSessionsView,
  ChartsView,
  SettingsView,
  SummaryView,
  CommunityView,
  SavedTripsView, // <-- 4. REGISTRAR LA NUEVA VISTA
});

// --- 5. LÓGICA DE NAVEGACIÓN ACTUALIZADA ---
function switchToView(viewName) {
  // Caso especial para el replay de manos guardadas
  if (viewName === undefined || viewName === 'CurrentHandView') {
    currentView.value = 'CurrentHandView';
    return;
  }
  
  // Si hacemos clic en "Comunidad" desde cualquier otra vista que no sea "Viajes Guardados",
  // reseteamos el estado para empezar un viaje nuevo.
  if (viewName === 'CommunityView' && currentView.value !== 'SavedTripsView') {
      tripStore.resetCurrentTrip();
  }

  currentView.value = viewName;
}

// Mantenemos la función original por si algún componente la sigue usando sin argumentos
function switchToCurrentHandView() {
  currentView.value = 'CurrentHandView';
}
</script>

<style scoped>
#main-container {
  width: 100%;
}
nav {
  padding: 10px;
  background-color: #2d3748;
  border-bottom: 2px solid var(--border-color);
}
nav button {
  margin: 0 10px;
  background-color: transparent;
  border: 1px solid var(--primary-color);
}
nav button.active {
  background-color: var(--primary-color);
}
main {
  width: 100%;
}
</style>