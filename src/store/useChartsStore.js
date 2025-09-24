import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useChartsStore = defineStore('charts', () => {
  // --- STATE ---
  const timeRange = ref('all');
  const chartType = ref('line'); // <-- NUEVO ESTADO: 'line' o 'bar'

  // --- ACTIONS ---
  function setTimeRange(newRange) {
    timeRange.value = newRange;
  }

  function toggleChartType() {
    chartType.value = chartType.value === 'line' ? 'bar' : 'line';
  }

  return {
    timeRange,
    chartType, // <-- Exportar nuevo estado
    setTimeRange,
    toggleChartType, // <-- Exportar nueva acción
  };
});