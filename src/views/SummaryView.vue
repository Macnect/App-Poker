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
import { computed, ref, onActivated } from 'vue';
import { useSessionStore } from '../store/useSessionStore';
import { useGameStore } from '../store/game';

const sessionStore = useSessionStore();
const gameStore = useGameStore();
const isLoading = ref(true);

onActivated(async () => {
    isLoading.value = true;
    await Promise.all([
        sessionStore.fetchSessions(),
        gameStore.fetchHands()
    ]);
    isLoading.value = false;
});

const bbPer100 = computed(() => {
  const totalHands = gameStore.savedHands.length;
  if (totalHands === 0) return 0;
  
  const totalProfit = sessionStore.totalNetProfit;
  
  const handsWithBlinds = gameStore.savedHands.filter(hand => hand.ciega_grande > 0);
  if (handsWithBlinds.length === 0) return 0;
  
  const totalBigBlindValue = handsWithBlinds.reduce((sum, hand) => sum + hand.ciega_grande, 0);
  const averageBigBlind = totalBigBlindValue / handsWithBlinds.length;

  if (averageBigBlind === 0) return 0;
  
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
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   SummaryView - Statistics Dashboard
   ======================================== */

/* Import Premium Modern Font - Poppins */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

* {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-feature-settings: 'liga' 1, 'calt' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.summary-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 70px);
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
}

h2 {
  text-align: center;
  margin-bottom: 2.5rem;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

/* ========================================
   FILTERS - Premium Card
   ======================================== */
.filters-container {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
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

.filters-container label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.filters-container select {
  padding: 12px 18px;
  font-size: 1.05rem;
  font-weight: 500;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  border-radius: 10px;
  color: #f9fafb;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.filters-container select:hover {
  border-color: rgba(212, 175, 55, 0.4);
}

.filters-container select:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1);
}

.filters-container select option {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 12px 16px;
  font-weight: 500;
}

.loading-message,
.no-data-message {
  text-align: center;
  font-size: 1.2rem;
  color: #d1d5db;
  font-weight: 500;
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4);
}

/* ========================================
   STATS GRID - Premium Cards
   ======================================== */
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-card {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: cardSlideIn 0.5s ease-out;
}

.stat-card:hover {
  transform: translateY(-3px);
  border-color: rgba(212, 175, 55, 0.25);
  box-shadow:
    0 8px 16px -2px rgba(0, 0, 0, 0.35),
    0 16px 32px -4px rgba(0, 0, 0, 0.25),
    0 0 24px rgba(212, 175, 55, 0.08);
}

.stat-title {
  font-size: 0.95rem;
  color: #d1d5db;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.stat-value {
  font-size: 3rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* ========================================
   DETAILED SUMMARY PANEL
   ======================================== */
.detailed-summary-panel {
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 16px;
  padding: 2rem;
  margin-top: 2.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: cardSlideIn 0.5s ease-out;
}

.detailed-summary-panel h3 {
  margin: 0 0 2rem 0;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  color: #f9fafb;
  border-bottom: 1.5px solid rgba(212, 175, 55, 0.2);
  padding-bottom: 1.25rem;
  letter-spacing: -0.01em;
}

.detailed-stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.1);
  transition: all 0.3s ease;
}

.detail-item:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.2) 0%, rgba(31, 41, 55, 0.3) 100%);
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin: 0 -1.25rem;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item span:first-child {
  color: #d1d5db;
  font-weight: 500;
}

.detail-item span:last-child {
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.profit-text {
  color: #10b981;
}

.loss-text {
  color: #fc8181;
}

.even-text {
  color: #e2e8f0;
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 640px) {
  .summary-container {
    padding: 1rem;
  }

  h2 {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .filters-container {
    flex-direction: column;
    padding: 1rem;
  }

  .stat-card {
    padding: 1.5rem 1rem;
  }

  .stat-value {
    font-size: 2.5rem;
  }

  .detailed-summary-panel {
    padding: 1.5rem;
  }

  .detail-item {
    font-size: 1rem;
    padding: 0.75rem 0;
  }
}

@media (min-width: 768px) {
  .summary-container {
    padding: 2.5rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  .detailed-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem 3rem;
  }

  .detail-item {
    font-size: 1.15rem;
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>