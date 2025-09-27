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
        <button @click="navigateTo('SavedHandsView')">{{ $t('nav.savedHands') }}</button>
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
      <button @click="switchToView('SavedSessionsView')" :class="{ active: currentView === 'SavedSessionsView' }">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
        <span>{{ $t('nav.savedSessions') }}</span>
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
</template>

<script setup>
import { ref, shallowRef } from 'vue';
import { useTripStore } from './store/useTripStore';
import { useAuthStore } from './store/useAuthStore';
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

const authStore = useAuthStore();
const currentView = ref('CurrentHandView');
const tripStore = useTripStore();
const showMoreMenu = ref(false);

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

function navigateTo(viewName) {
  switchToView(viewName);
}
</script>

<style scoped>
#main-container {
  width: 100%;
}

main {
  width: 100%;
}

nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: #2d3748;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
}

nav button {
  background-color: transparent;
  border: none;
  color: #a0aec0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  flex-grow: 1;
  font-size: 0.75rem;
}

nav button svg {
  width: 24px;
  height: 24px;
}

nav button.active {
  color: var(--primary-color);
}

@media (hover: hover) and (pointer: fine) {
  nav button:not(.active):hover {
      background-color: rgba(74, 85, 104, 0.2);
  }
}

.more-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.more-menu-panel {
  background-color: #2d3748;
  width: 100%;
  max-width: 500px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  padding: 1rem;
  padding-bottom: 90px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  animation: slide-up 0.3s ease-out;
}

.more-menu-panel button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  text-align: left;
  background-color: #4a5568;
  border: none;
}

.more-menu-panel button.logout-btn {
  border-top: 1px solid var(--border-color);
  margin-top: 0.5rem;
  color: #fc8181;
}

@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>