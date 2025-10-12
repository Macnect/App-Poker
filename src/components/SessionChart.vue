<template>
  <div class="chart-container">
    <!-- Display del valor actual para gráfica de línea -->
    <div v-if="chartsStore.chartType === 'line' && currentProfit !== null" class="current-profit-display">
      <span class="profit-label">{{ t('charts.cumulativeProfit') }}:</span>
      <span class="profit-value" :class="{ positive: currentProfit >= 0, negative: currentProfit < 0 }">
        {{ formatCurrency(currentProfit) }}
      </span>
    </div>

    <!-- Renderizado condicional del tipo de gráfico. El :key fuerza el redibujado al cambiar -->
    <Line v-if="chartsStore.chartType === 'line'" :key="'line-' + chartsStore.timeRange" :data="lineChartData" :options="chartOptions" />
    <Bar v-else :key="'bar-' + chartsStore.timeRange" :data="barChartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useSessionStore } from '../store/useSessionStore';
import { useChartsStore } from '../store/useChartsStore';
import { useI18n } from 'vue-i18n';
import { Line, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler
);

const sessionStore = useSessionStore();
const chartsStore = useChartsStore();
const { t } = useI18n();

const filteredSessions = computed(() => {
  const allSessions = sessionStore.savedSessions;
  const range = chartsStore.timeRange;
  
  if (range === 'all') {
    return allSessions;
  }

  const now = new Date();
  const cutoffDate = new Date();

  switch (range) {
    case '7d': cutoffDate.setDate(now.getDate() - 7); break;
    case '1m': cutoffDate.setMonth(now.getMonth() - 1); break;
    case '3m': cutoffDate.setMonth(now.getMonth() - 3); break;
    case '6m': cutoffDate.setMonth(now.getMonth() - 6); break;
    case '1y': cutoffDate.setFullYear(now.getFullYear() - 1); break;
  }

  return allSessions.filter(session => {
    // La fecha de la DB ya es un objeto Date o un string compatible
    const sessionDate = new Date(session.fecha);
    return sessionDate >= cutoffDate;
  });
});

const sessionsInChronologicalOrder = computed(() => {
  // Ordenamos de la más antigua a la más nueva para la gráfica de líneas
  return [...filteredSessions.value].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
});

// Calcular el beneficio acumulado actual (último punto de la gráfica)
const currentProfit = computed(() => {
  const sessions = sessionsInChronologicalOrder.value;
  if (sessions.length === 0) return null;

  let cumulative = 0;
  sessions.forEach(s => {
    cumulative += parseFloat(s.resultado) || 0;
  });

  return cumulative;
});

// Formatear moneda
const formatCurrency = (value) => {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${sessionStore.currency}${value.toFixed(2)}`;
};

const lineChartData = computed(() => {
  const sessions = sessionsInChronologicalOrder.value;
  // Usamos 'fecha' y lo formateamos para las etiquetas
  const labels = sessions.map(s => new Date(s.fecha + 'T12:00:00').toLocaleDateString());
  let cumulativeProfit = 0;
  const dataPoints = sessions.map(s => {
    // *** CAMBIO CLAVE: Usamos 'resultado' y lo convertimos a número ***
    cumulativeProfit += parseFloat(s.resultado) || 0; 
    return cumulativeProfit;
  });

  return {
    labels: ['Inicio', ...labels],
    datasets: [{
      label: t('charts.cumulativeProfit'),
      data: [0, ...dataPoints],
      borderColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return null;
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(0.5, '#f59e0b');
        gradient.addColorStop(1, '#10b981');
        return gradient;
      },
      backgroundColor: (context) => {
         const chart = context.chart;
        const { ctx, chartArea } = chart;
         if (!chartArea) return null;
         const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
         gradient.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
         gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.25)');
         gradient.addColorStop(1, 'rgba(16, 185, 129, 0.25)');
         return gradient;
      },
      borderWidth: 4,
      pointBackgroundColor: '#d4af37',
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      pointRadius: 2,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: true,
    }],
  };
});

const barChartData = computed(() => {
  const sessions = sessionsInChronologicalOrder.value;
  // Usamos 'fecha' y lo formateamos para las etiquetas
  const labels = sessions.map(s => new Date(s.fecha + 'T12:00:00').toLocaleDateString());
  // *** CAMBIO CLAVE: Usamos 'resultado' y lo convertimos a número ***
  const dataPoints = sessions.map(s => parseFloat(s.resultado) || 0);

  return {
    labels,
    datasets: [{
      label: 'Resultado de la Sesión',
      data: dataPoints,
      backgroundColor: dataPoints.map(val => val >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
      borderColor: dataPoints.map(val => val >= 0 ? '#10b981' : '#ef4444'),
      borderWidth: 2,
    }],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  aspectRatio: undefined,
  layout: {
    padding: {
      bottom: 5,
      left: 5,
      right: 5,
      top: 50
    }
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          if (context.dataIndex === 0 && context.dataset.label === t('charts.cumulativeProfit')) {
            return ` ${t('charts.cumulativeProfit')}: ${sessionStore.currency}0.00`;
          }

          let label = '';
          let value = 0;

          if (context.dataset.label === t('charts.cumulativeProfit')) {
            const session = sessionsInChronologicalOrder.value[context.dataIndex - 1];
            if (session) {
              label = 'Resultado de la Sesión: ';
              value = parseFloat(session.resultado);
            }
          }
          else {
            label = 'Resultado de la Sesión: ';
            value = context.parsed.y;
          }

          if (value !== null) {
            const prefix = value >= 0 ? '+' : '';
            label += `${prefix}${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)}`;
          }
          return label;
        },
        labelColor: function(context) {
          let value = 0;
          if (context.dataset.label === t('charts.cumulativeProfit')) {
            if (context.dataIndex > 0) {
              const session = sessionsInChronologicalOrder.value[context.dataIndex - 1];
              if (session) {
                value = parseFloat(session.resultado);
              }
            }
          }
          else {
            value = context.parsed.y;
          }

          return {
            borderColor: value >= 0 ? '#10b981' : '#ef4444',
            backgroundColor: value >= 0 ? '#10b981' : '#ef4444',
          };
        }
      },
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.5)',
      borderWidth: 2,
      titleFont: { size: 16, weight: 'bold' },
      bodyFont: { size: 14 },
      padding: 15,
      usePointStyle: true,
      boxPadding: 6
    },
  },
  scales: {
    y: {
      ticks: {
        color: '#d1d5db',
        font: { size: 13, weight: '500' },
        callback: (value) => `${sessionStore.currency}${value}`
      },
      grid: {
        color: 'rgba(156, 163, 175, 0.2)',
        lineWidth: 1
      },
    },
    x: {
      ticks: {
        color: '#d1d5db',
        font: { size: 9 },
        maxRotation: 45,
        minRotation: 45,
        autoSkip: true,
        maxTicksLimit: 10
      },
      grid: {
        display: true,
        color: 'rgba(156, 163, 175, 0.1)'
      },
    },
  },
};
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.current-profit-display {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 8px;
  padding: 4px 10px;
  margin-bottom: -10px;
  flex-shrink: 0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.profit-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.025em;
}

.profit-value {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.profit-value.positive {
  color: #10b981;
  text-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
}

.profit-value.negative {
  color: #ef4444;
  text-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
}

/* Landscape optimization */
@media (orientation: landscape) {
  .current-profit-display {
    top: 1px;
    padding: 6px 12px;
  }

  .profit-label {
    font-size: 0.75rem;
  }

  .profit-value {
    font-size: 1rem;
  }
}
</style>