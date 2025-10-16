<template>
  <div class="charts-container">
    <div class="header">
      <h2>{{ $t('charts.title') }}</h2>

      <div class="controls-wrapper">
        <div class="filter-controls">
          <label for="time-range">Mostrar:</label>
          <select id="time-range" v-model="chartsStore.timeRange">
            <option value="all">Todo</option>
            <option value="7d">Última Semana</option>
            <option value="1m">Último Mes</option>
            <option value="3m">Últimos 3 Meses</option>
            <option value="6m">Últimos 6 Meses</option>
            <option value="1y">Último Año</option>
          </select>
        </div>

        <button @click="chartsStore.toggleChartType()" class="toggle-chart-btn" :title="`Cambiar a gráfico de ${chartsStore.chartType === 'line' ? 'barras' : 'líneas'}`">
          <svg v-if="chartsStore.chartType === 'line'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-2.25M21 12l-3.75 2.25" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-message">
        Cargando datos para la gráfica...
    </div>
    <div v-else-if="currentSessions.length < 2" class="no-data-message">
      {{ $t('charts.noData') }}
    </div>
    <div v-else class="chart-wrapper">
      <SessionChart v-if="!isTournamentMode" />
      <TournamentSessionChart v-else />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onActivated, inject } from 'vue';
import { useSessionStore } from '../store/useSessionStore';
import { useTournamentSessionStore } from '../store/useTournamentSessionStore';
import { useChartsStore } from '../store/useChartsStore';
import SessionChart from '../components/SessionChart.vue';
import TournamentSessionChart from '../components/TournamentSessionChart.vue';

const sessionStore = useSessionStore();
const tournamentSessionStore = useTournamentSessionStore();
const chartsStore = useChartsStore();
const isLoading = ref(true);

// Detectar si estamos en modo torneo por el componente padre
// Si estamos dentro de TournamentsView, será true
const isTournamentMode = computed(() => {
  // Intentar determinar el modo basándose en el localStorage
  const selectedGameMode = localStorage.getItem('selectedGameMode');
  return selectedGameMode === 'tournament';
});

// Computed para obtener las sesiones correctas según el modo
const currentSessions = computed(() => {
  if (isTournamentMode.value) {
    return tournamentSessionStore.savedSessions;
  }
  return sessionStore.savedSessions;
});

onActivated(async () => {
    isLoading.value = true;
    if (!isTournamentMode.value) {
      await sessionStore.fetchSessions();
    }
    // Las sesiones de torneo ya están en memoria (localStorage)
    isLoading.value = false;
});
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   ChartsView - Visual Analytics
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.charts-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
  overflow: hidden; /* Evita scroll */
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
  flex-shrink: 0;
}

h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.controls-wrapper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: nowrap;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.8) 100%);
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid rgba(212, 175, 55, 0.15);
}

.filter-controls label {
  font-weight: 600;
  font-size: 0.7rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.filter-controls select {
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  border-radius: 8px;
  color: #f9fafb;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.filter-controls select:hover {
  border-color: rgba(212, 175, 55, 0.4);
}

.filter-controls select:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1);
}

.filter-controls select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 8px;
}

.toggle-chart-btn {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(212, 175, 55, 0.25);
  border-radius: 8px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.toggle-chart-btn:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  border-color: rgba(212, 175, 55, 0.4);
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.toggle-chart-btn:active {
  transform: translateY(0);
}

.toggle-chart-btn svg {
  width: 18px;
  height: 18px;
  color: #d4af37;
  filter: drop-shadow(0 2px 4px rgba(212, 175, 55, 0.2));
}

.loading-message,
.no-data-message {
  text-align: center;
  font-size: 1rem;
  color: #d1d5db;
  font-weight: 500;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  padding: 1.5rem 1rem;
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4);
  animation: cardSlideIn 0.5s ease-out;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-wrapper {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  padding: 0.5rem;
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: cardSlideIn 0.5s ease-out;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chart-wrapper > div {
  flex: 1;
  min-height: 0;
}

/* ========================================
   LANDSCAPE ORIENTATION OPTIMIZATIONS
   ======================================== */
@media (orientation: landscape) {
  .charts-container {
    padding: 0.5rem 1rem 0.5rem 1rem; /* Padding mínimo y simétrico */
    height: calc(100vh - 65px); /* Resta la altura de la barra de navegación (65px en landscape) */
    max-height: calc(100vh - 65px);
    overflow: hidden; /* Evita scroll en el contenedor principal */
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .header {
    flex-direction: row;
    margin-bottom: 0.5rem; /* Mínimo margen */
    gap: 0.75rem;
    flex-shrink: 0; /* No se comprime */
  }

  h2 {
    font-size: 1rem; /* Reducido aún más para ahorrar espacio vertical */
    margin: 0;
    line-height: 1.2;
  }

  .chart-wrapper {
    flex: 1; /* Ocupa el espacio restante disponible */
    min-height: 0; /* Permite que flex funcione correctamente */
    padding: 0.25rem; /* Padding mínimo para maximizar área del gráfico */
    overflow: hidden; /* Evita cualquier scroll interno */
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .chart-wrapper > div {
    flex: 1;
    min-height: 0;
  }

  .controls-wrapper {
    flex-wrap: nowrap;
    gap: 0.5rem;
  }

  .filter-controls {
    padding: 3px 8px; /* Aún más compacto */
  }

  .filter-controls label {
    font-size: 0.65rem; /* Más pequeño */
  }

  .filter-controls select {
    padding: 3px 8px;
    font-size: 0.75rem; /* Más pequeño */
  }

  .toggle-chart-btn {
    padding: 6px;
  }

  .toggle-chart-btn svg {
    width: 20px;
    height: 20px;
  }

  .loading-message,
  .no-data-message {
    padding: 1rem 0.75rem; /* Reducido padding en mensajes */
    font-size: 1rem;
  }
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 640px) {
  .charts-container {
    padding: 1rem;
  }

  h2 {
    font-size: 2rem;
  }

  .header {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-wrapper {
    justify-content: center;
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }

  .filter-controls select {
    width: 100%;
  }

  .chart-wrapper {
    padding: 1.5rem;
  }
}
</style>