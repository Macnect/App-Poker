<template>
  <div class="charts-container">
    <div class="header">
      <h2>{{ $t('charts.title') }}</h2>
      
      <div class="controls-wrapper">
        <!-- Selector de rango de tiempo -->
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

        <!-- ===== BOTÓN NUEVO PARA CAMBIAR TIPO DE GRÁFICO ===== -->
        <button @click="chartsStore.toggleChartType()" class="toggle-chart-btn" :title="`Cambiar a gráfico de ${chartsStore.chartType === 'line' ? 'barras' : 'líneas'}`">
          <!-- Icono de gráfico de barras (se muestra si el gráfico activo es el de líneas) -->
          <svg v-if="chartsStore.chartType === 'line'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <!-- Icono de gráfico de líneas (se muestra si el gráfico activo es el de barras) -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-2.25M21 12l-3.75 2.25" />
          </svg>
        </button>
      </div>
    </div>
    
    <div v-if="sessionStore.savedSessions.length < 2" class="no-data-message">
      {{ $t('charts.noData') }}
    </div>
    <div v-else class="chart-wrapper">
      <SessionChart />
    </div>
  </div>
</template>

<script setup>
import { useSessionStore } from '../store/useSessionStore';
import { useChartsStore } from '../store/useChartsStore';
import SessionChart from '../components/SessionChart.vue';

const sessionStore = useSessionStore();
const chartsStore = useChartsStore();
</script>

<style scoped>
.charts-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}
h2 {
  margin: 0;
  font-size: 2rem;
}
.controls-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.filter-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.filter-controls label {
  font-weight: bold;
  color: #a0aec0;
}
.filter-controls select {
  padding: 8px 12px;
  font-size: 1rem;
  background-color: #4A5568;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: white;
}
.toggle-chart-btn {
  background-color: #4A5568;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.toggle-chart-btn:hover {
  background-color: #2D3748;
}
.toggle-chart-btn svg {
  width: 24px;
  height: 24px;
  color: white;
}
.no-data-message {
  text-align: center;
  font-size: 1.2rem;
  color: #a0aec0;
  background-color: #2d3748;
  padding: 2rem;
  border-radius: 12px;
}
.chart-wrapper {
  background-color: #2d3748;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}
</style>