<template>
  <div v-if="authStore.user" id="main-container">
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
      <button @click="switchToView('CommunityView')" :class="{ active: currentView === 'CommunityView' }">
        Viajes
      </button>
      <button @click="currentView = 'SavedTripsView'" :class="{ active: currentView === 'SavedTripsView' }">
        Viajes Guardados
      </button>
      <button @click="currentView = 'SettingsView'" :class="{ active: currentView === 'SettingsView' }">
        {{ $t('nav.settings') }}
      </button>
      <!-- Botón para cerrar sesión -->
      <button @click="authStore.signOut()" class="logout-btn">
        Salir
      </button>
    </nav>
    <main>
      <component :is="views[currentView]" @switch-view="switchToView" />
    </main>
  </div>
  <AuthView v-else />
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import { useTripStore } from './store/useTripStore';
import { useAuthStore } from './store/useAuthStore'; // <-- IMPORTAR AUTH STORE
import CurrentHandView from './views/CurrentHandView.vue';
import SavedHandsView from './views/SavedHandsView.vue';
import LiveSessionView from './views/LiveSessionView.vue';
import SavedSessionsView from './views/SavedSessionsView.vue';
import ChartsView from './views/ChartsView.vue';
import SettingsView from './views/SettingsView.vue';
import SummaryView from './views/SummaryView.vue';
import CommunityView from './views/CommunityView.vue';
import SavedTripsView from './views/SavedTripsView.vue';
import AuthView from './views/AuthView.vue'; // <-- IMPORTAR AUTH VIEW

const authStore = useAuthStore(); // <-- INICIALIZAR AUTH STORE
const currentView = ref('CurrentHandView');
const tripStore = useTripStore();

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
});

function switchToView(viewName) {
  if (viewName === undefined || viewName === 'CurrentHandView') {
    currentView.value = 'CurrentHandView';
    return;
  }
  
  if (viewName === 'CommunityView' && currentView.value !== 'SavedTripsView') {
      tripStore.resetCurrentTrip();
  }

  currentView.value = viewName;
}

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
  display: flex; /* Añadido para mejor alineación */
  flex-wrap: wrap; /* Para que los botones se ajusten en pantallas pequeñas */
  justify-content: center; /* Centrar botones */
}
nav button {
  margin: 5px 10px; /* Ajuste de margen para wrapping */
  background-color: transparent;
  border: 1px solid var(--primary-color);
}
nav button.active {
  background-color: var(--primary-color);
}
nav .logout-btn {
  border-color: #e53e3e;
  color: #e53e3e;
}
nav .logout-btn:hover {
  background-color: #e53e3e;
  color: white;
}
main {
  width: 100%;
}
</style>