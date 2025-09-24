<template>
  <div class="summary-container">
    <h2>{{ $t('summary.title') }}</h2>
    <div v-if="sessionStore.savedSessions.length === 0" class="no-data-message">
      No hay sesiones guardadas para generar un sumario.
    </div>
    <template v-else>
      <!-- CAMBIADO A FLEX-COLUMN PARA APILAR LAS TARJETAS -->
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
        <!-- CAMBIADO A FLEX-COLUMN PARA APILAR LOS DETALLES -->
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
import { computed } from 'vue';
import { useSessionStore } from '../store/useSessionStore';
import { useGameStore } from '../store/game';

const sessionStore = useSessionStore();
const gameStore = useGameStore();

const bbPer100 = computed(() => {
  const totalHands = gameStore.savedHands.length;
  if (totalHands === 0) {
    return 0;
  }
  
  const totalProfit = sessionStore.totalNetProfit;

  // Calcula el tamaño medio de la Ciega Grande a partir de todas las manos guardadas
  const totalBigBlindValue = gameStore.savedHands.reduce((sum, hand) => sum + (hand.bigBlind || 0), 0);
  const averageBigBlind = totalBigBlindValue / totalHands;

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
  padding: 2rem;
  max-width: 700px; /* Ancho reducido para una mejor visualización en columna */
  margin: 0 auto;
}
h2 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem; /* Título más grande */
}
.no-data-message {
  text-align: center;
  font-size: 1.2rem;
  color: #a0aec0;
  background-color: #2d3748;
  padding: 2rem;
  border-radius: 12px;
}

/* --- ESTADÍSTICAS PRINCIPALES --- */
.stats-grid {
  display: flex; /* Cambiado a flex */
  flex-direction: column; /* Apilado vertical */
  gap: 1.5rem; /* Espacio entre tarjetas */
}
.stat-card {
  background-color: #2d3748;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem; /* Espacio entre título y valor */
}
.stat-title {
  font-size: 1.3rem; /* Texto más grande */
  color: #a0aec0;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.stat-value {
  font-size: 3.2rem; /* Valor mucho más grande */
  font-weight: bold;
}

/* --- PANEL DE DETALLES --- */
.detailed-summary-panel {
  background-color: #2d3748;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem 2rem;
  margin-top: 2.5rem; /* Más espacio arriba */
}
.detailed-summary-panel h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem; /* Título de sección más grande */
  text-align: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}
.detailed-stats-grid {
  display: flex; /* Cambiado a flex */
  flex-direction: column; /* Apilado vertical */
  gap: 1rem; /* Espacio entre cada detalle */
}
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.4rem; /* Texto de detalles más grande */
  padding: 0.75rem 0.25rem;
  border-bottom: 1px solid #3c485e;
}
.detail-item:last-child {
  border-bottom: none;
}
.detail-item span:first-child {
  color: #a0aec0;
}
.detail-item span:last-child {
  font-weight: bold;
}

/* --- CLASES DE COLOR PARA RESULTADOS --- */
.profit-text {
  color: #68d391;
}
.loss-text {
  color: #fc8181;
}
.even-text {
  color: #e2e8f0; /* Color de texto por defecto */
}
</style>