<template>
  <div class="summary-container">
    <h2>{{ $t('summary.title') }}</h2>

    <div class="filters-container">
      <label for="summary-date-filter">Mostrar datos de:</label>
      <select 
        id="summary-date-filter"
        :value="sessionStore.summaryDateFilter" 
        @change="sessionStore.setSummaryDateFilter($event.target.value)"
      >
        <option value="all">Todo</option>
        <option value="last7days">Última semana</option>
        <option value="last1month">Último mes</option>
        <option value="last3months">Últimos 3 meses</option>
        <option value="last6months">Últimos 6 meses</option>
        <option value="last1year">Último año</option>
      </select>
    </div>
    
    <div v-if="isLoading" class="loading-message">
        Cargando datos del sumario...
    </div>
    <div v-else-if="sessionStore.sessionCount === 0" class="no-data-message">
      No hay sesiones guardadas para el período seleccionado.
    </div>
    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-title">{{ $t('summary.totalProfit') }}</span>
          <span class="stat-value" :class="getResultClass(sessionStore.totalNetProfit)">{{ formatCurrency(sessionStore.totalNetProfit) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-title">ROI</span>
          <span class="stat-value" :class="getResultClass(sessionStore.roi)">{{ sessionStore.roi.toFixed(2) }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-title">{{ $t('summary.avgBuyIn') }}</span>
          <span class="stat-value">{{ formatCurrency(sessionStore.averageBuyIn, false) }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-title">{{ $t('summary.avgCashOut') }}</span>
          <span class="stat-value">{{ formatCurrency(sessionStore.averageCashOut, false) }}</span>
        </div>
      </div>
      
      <div class="detailed-summary-panel">
        <h3>{{ $t('summary.sessionsTitle') }}</h3>
        <div class="detailed-stats-grid">
          <div class="detail-item">
            <span>{{ $t('summary.sessionCount') }}</span>
            <span>{{ sessionStore.sessionCount }}</span>
          </div>
           <div class="detail-item">
            <span>Manos guardadas</span>
            <span>{{ gameStore.savedHands.length }}</span>
          </div>
          <div class="detail-item">
            <span>Días ganadores</span>
            <span class="profit-text">{{ sessionStore.winningDays }}</span>
          </div>
           <div class="detail-item">
            <span>Días perdedores</span>
            <span class="loss-text">{{ sessionStore.losingDays }}</span>
          </div>
          <div class="detail-item">
            <span>Mejor día</span>
            <span class="profit-text">{{ formatCurrency(sessionStore.bestDay) }}</span>
          </div>
           <div class="detail-item">
            <span>Peor día</span>
            <span class="loss-text">{{ formatCurrency(sessionStore.worstDay) }}</span>
          </div>
           <div class="detail-item">
            <span>Racha ganadora</span>
            <span>{{ sessionStore.winningStreak }} días</span>
          </div>
          <div class="detail-item">
            <span>Ganancias/Hora</span>
            <span :class="getResultClass(sessionStore.winRatePerHour)">{{ formatCurrency(sessionStore.winRatePerHour) }}/h</span>
          </div>
           <div class="detail-item">
            <span>BB/100</span>
            <span :class="getResultClass(bbPer100)">{{ bbPer100.toFixed(2) }}</span>
          </div>
          <div class="detail-item">
            <span>Media de rebuys</span>
            <span>{{ formatCurrency(sessionStore.averageRebuys, false) }}</span>
          </div>
          <div class="detail-item">
            <span>Propinas y Consumiciones</span>
            <span>{{ formatCurrency(sessionStore.totalAllExpenses, false) }}</span>
          </div>
          <div class="detail-item">
            <span>{{ $t('summary.totalHours') }}</span>
            <span>{{ sessionStore.totalHoursPlayed.toFixed(2) }}h</span>
          </div>
          <div class="detail-item">
            <span>{{ $t('summary.avgHours') }}</span>
            <span>{{ sessionStore.averageHoursPlayed.toFixed(2) }}h</span>
          </div>
          <div class="detail-item">
            <span>{{ $t('summary.avgBreak') }}</span>
            <span>{{ sessionStore.averageBreakDuration.toFixed(0) }}min</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'; // Añadir ref y onMounted
import { useSessionStore } from '../store/useSessionStore';
import { useGameStore } from '../store/game';

const sessionStore = useSessionStore();
const gameStore = useGameStore();
const isLoading = ref(true); // Estado de carga

// Cargar los datos necesarios al montar la vista
onMounted(async () => {
    isLoading.value = true;
    // Cargamos tanto sesiones como manos para tener todos los datos
    await sessionStore.fetchSessions();
    await gameStore.fetchHands();
    isLoading.value = false;
});

const bbPer100 = computed(() => {
  const totalHands = gameStore.savedHands.length;
  if (totalHands === 0) {
    return 0;
  }
  
  const totalProfit = sessionStore.totalNetProfit;

  // Usamos solo las manos guardadas que tienen un valor de bigBlind
  const handsWithBlinds = gameStore.savedHands.filter(hand => hand.ciega_grande > 0);
  if (handsWithBlinds.length === 0) return 0;
  
  const totalBigBlindValue = handsWithBlinds.reduce((sum, hand) => sum + hand.ciega_grande, 0);
  const averageBigBlind = totalBigBlindValue / handsWithBlinds.length;

  if (averageBigBlind === 0) {
    return 0;
  }
  
  const profitInBB = totalProfit / averageBigBlind;
  const winRate = (profitInBB / totalHands) * 100;
  
  return winRate;
});


function formatCurrency(value, showSign = true) {
  if (typeof value !== 'number') return `${sessionStore.currency}0.00`;
  const prefix = value >= 0 ? '+' : '';
  if (showSign) {
     return `${prefix}${sessionStore.currency}${value.toFixed(2)}`;
  }
  return `${sessionStore.currency}${value.toFixed(2)}`;
}

function getResultClass(result) {
  if (typeof result !== 'number' || result === 0) return 'even-text';
  if (result > 0) return 'profit-text';
  if (result < 0) return 'loss-text';
  return 'even-text';
}
</script>

<style scoped>
.summary-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}
h2 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.filters-container {
  background-color: #2d3748;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}
.filters-container label {
  font-weight: bold;
  font-size: 1.1rem;
  color: #a0aec0;
}
.filters-container select {
  padding: 10px 15px;
  font-size: 1.1rem;
  background-color: #4A5568;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: white;
}

.loading-message, .no-data-message {
  text-align: center;
  font-size: 1.2rem;
  color: #a0aec0;
  background-color: #2d3748;
  padding: 2rem;
  border-radius: 12px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.stat-card {
  background-color: #2d3748;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.stat-title {
  font-size: 1.1rem;
  color: #a0aec0;
  font-weight: bold;
  text-transform: uppercase;
}
.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
}
.detailed-summary-panel {
  background-color: #2d3748;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 2rem;
}
.detailed-summary-panel h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}
.detailed-stats-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #3c485e;
}
.detail-item:last-child { border-bottom: none; }
.detail-item span:first-child { color: #a0aec0; }
.detail-item span:last-child { font-weight: bold; }
.profit-text { color: #68d391; }
.loss-text { color: #fc8181; }
.even-text { color: #e2e8f0; }

@media (min-width: 768px) {
  .summary-container { padding: 2rem; }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
  .detailed-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem 2rem;
  }
  .detail-item { font-size: 1.2rem; }
}
@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>