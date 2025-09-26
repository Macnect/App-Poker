<template>
  <div>
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
    const parts = session.date.split('/');
    const sessionDate = new Date(parts[2], parts[1] - 1, parts[0]);
    return sessionDate >= cutoffDate;
  });
});

const sessionsInChronologicalOrder = computed(() => {
  return [...filteredSessions.value].reverse();
});

const lineChartData = computed(() => {
  const sessions = sessionsInChronologicalOrder.value;
  const labels = sessions.map(s => s.date);
  let cumulativeProfit = 0;
  const dataPoints = sessions.map(s => {
    cumulativeProfit += s.result || 0; 
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
        gradient.addColorStop(0, '#c53030');
        gradient.addColorStop(0.5, '#718096');
        gradient.addColorStop(1, '#38a169');
        return gradient;
      },
      backgroundColor: (context) => {
         const chart = context.chart;
        const { ctx, chartArea } = chart;
         if (!chartArea) return null;
         const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
         gradient.addColorStop(0, 'rgba(197, 48, 48, 0.2)');
         gradient.addColorStop(0.5, 'rgba(74, 85, 104, 0.2)');
         gradient.addColorStop(1, 'rgba(56, 161, 105, 0.2)');
         return gradient;
      },
      borderWidth: 3,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#fff',
      tension: 0.1,
      fill: true,
    }],
  };
});

const barChartData = computed(() => {
  const sessions = sessionsInChronologicalOrder.value;
  const labels = sessions.map(s => s.date);
  const dataPoints = sessions.map(s => s.result || 0);

  return {
    labels,
    datasets: [{
      label: 'Resultado de la Sesión',
      data: dataPoints,
      backgroundColor: dataPoints.map(val => val >= 0 ? 'rgba(56, 161, 105, 0.6)' : 'rgba(197, 48, 48, 0.6)'),
      borderColor: dataPoints.map(val => val >= 0 ? '#38a169' : '#c53030'),
      borderWidth: 1,
    }],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
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
              value = session.result;
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
        // --- FUNCIÓN AÑADIDA PARA EL COLOR DEL TEXTO ---
        labelColor: function(context) {
          let value = 0;
          // Si es el gráfico de líneas, obtenemos el resultado de la sesión individual
          if (context.dataset.label === t('charts.cumulativeProfit')) {
            // El índice de la sesión es dataIndex - 1 porque el gráfico tiene un punto extra de "Inicio"
            if (context.dataIndex > 0) {
              const session = sessionsInChronologicalOrder.value[context.dataIndex - 1];
              if (session) {
                value = session.result;
              }
            }
          } 
          // Si es el gráfico de barras, el valor ya es el resultado de la sesión
          else {
            value = context.parsed.y;
          }

          return {
            borderColor: value >= 0 ? '#68d391' : '#fc8181', // Verde para positivo, Rojo para negativo
            backgroundColor: value >= 0 ? '#68d391' : '#fc8181',
          };
        }
      },
      backgroundColor: 'rgba(26, 32, 44, 0.9)',
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 12 },
      padding: 10,
      borderColor: 'rgba(74, 85, 104, 0.8)',
      borderWidth: 1,
      // Habilitar que el color de la etiqueta (label) cambie
      usePointStyle: true, 
      boxPadding: 4
    },
  },
  scales: {
    y: {
      ticks: { color: '#a0aec0', callback: (value) => `${sessionStore.currency}${value}` },
      grid: { color: 'rgba(74, 85, 104, 0.4)' },
    },
    x: {
      ticks: { color: '#a0aec0' },
      grid: { display: false },
    },
  },
};
</script>